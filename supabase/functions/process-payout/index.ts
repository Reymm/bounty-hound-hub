import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-PAYOUT] ${step}${detailsStr}`);
};

// Platform fee: $2 + 5% from hunter's payout
const PLATFORM_FEE_PERCENT = 0.05;
const PLATFORM_FEE_FLAT = 2; // $2 flat fee

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Process payout function started");

    const { submissionId } = await req.json();
    if (!submissionId) throw new Error("submissionId is required");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get submission details with bounty info
    const { data: submission, error: submissionError } = await supabaseClient
      .from('Submissions')
      .select(`
        id,
        hunter_id,
        bounty_id,
        status,
        dispute_opened,
        dispute_reason,
        Bounties!Submissions_bounty_id_fkey(
          id,
          amount,
          poster_id,
          title
        )
      `)
      .eq('id', submissionId)
      .maybeSingle();

    if (submissionError || !submission) {
      throw new Error(`Submission not found: ${submissionError?.message}`);
    }

    if (submission.status !== 'accepted') {
      throw new Error('Can only process payout for accepted submissions');
    }

    // CRITICAL: Check if dispute is opened - hard block
    if (submission.dispute_opened) {
      logStep("BLOCKED: Dispute is open on this submission");
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot process payout: dispute is open on this submission',
        dispute_blocked: true,
        dispute_reason: submission.dispute_reason
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Retrieved submission", { 
      submissionId: submission.id,
      hunterId: submission.hunter_id,
      bountyId: submission.bounty_id,
      bountyAmount: submission.Bounties.amount
    });

    // Get the escrow transaction for this bounty
    const { data: escrowTx, error: escrowError } = await supabaseClient
      .from('escrow_transactions')
      .select('*')
      .eq('bounty_id', submission.bounty_id)
      .maybeSingle();

    if (escrowError || !escrowTx) {
      throw new Error(`Escrow transaction not found: ${escrowError?.message}`);
    }

    // CRITICAL: Check payout freeze - hard block
    if (escrowTx.payout_freeze) {
      logStep("BLOCKED: Payout is frozen", { reason: escrowTx.payout_freeze_reason });
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot process payout: payout is frozen',
        payout_frozen: true,
        freeze_reason: escrowTx.payout_freeze_reason
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // CRITICAL: Check if already captured - idempotency check
    if (escrowTx.capture_status === 'captured') {
      logStep("Already captured - returning success (idempotent)");
      return new Response(JSON.stringify({
        success: true,
        message: 'Payment already captured',
        already_captured: true,
        captured_at: escrowTx.captured_at
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found escrow transaction", {
      escrowId: escrowTx.id,
      paymentIntentId: escrowTx.stripe_payment_intent_id,
      status: escrowTx.status,
      captureStatus: escrowTx.capture_status,
      amount: escrowTx.amount
    });

    // Get hunter's profile including Connect account
    const { data: hunterProfile } = await supabaseClient
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_onboarding_complete, stripe_connect_payouts_enabled, full_name, username')
      .eq('id', submission.hunter_id)
      .maybeSingle();

    // CRITICAL: Require Stripe Connect onboarding before payout
    if (!hunterProfile?.stripe_connect_onboarding_complete) {
      logStep("Hunter has not completed Stripe Connect onboarding - blocking payout");
      return new Response(JSON.stringify({
        success: false,
        error: 'Hunter must complete Stripe Connect setup before receiving payout',
        requires_verification: true,
        hunter_id: submission.hunter_id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // CRITICAL: Require Stripe Connect account ID
    if (!hunterProfile?.stripe_connect_account_id) {
      logStep("Hunter has no Stripe Connect account ID - blocking payout");
      return new Response(JSON.stringify({
        success: false,
        error: 'Hunter must have a Stripe Connect account to receive payout',
        requires_verification: true,
        hunter_id: submission.hunter_id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Hunter has Stripe Connect", {
      connectAccountId: hunterProfile.stripe_connect_account_id,
      onboardingComplete: hunterProfile.stripe_connect_onboarding_complete,
      payoutsEnabled: hunterProfile.stripe_connect_payouts_enabled
    });

    // ============================================================
    // ATOMIC LOCK via RPC: Uses DB function with stale lock reclaim
    // ============================================================
    const lockId = crypto.randomUUID();
    
    const { data: lockResult, error: lockError } = await supabaseClient
      .rpc('acquire_capture_lock', {
        p_escrow_id: escrowTx.id,
        p_lock_id: lockId,
        p_lock_timeout_minutes: 5
      });

    if (lockError) {
      logStep("RPC lock error", { error: lockError.message });
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to acquire capture lock: ' + lockError.message,
        lock_failed: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // RPC returns array, get first row
    const lockRow = Array.isArray(lockResult) ? lockResult[0] : lockResult;
    
    if (!lockRow || !lockRow.success) {
      logStep("Failed to acquire capture lock", { message: lockRow?.message });
      return new Response(JSON.stringify({
        success: false,
        error: lockRow?.message || 'Could not acquire capture lock. Payment may already be processing.',
        lock_failed: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 409,
      });
    }

    logStep("Acquired capture lock via RPC", { 
      lockId, 
      escrowId: lockRow.escrow_id,
      paymentIntentId: lockRow.payment_intent_id
    });

    // Calculate payout amounts - $2 + 5% platform fee from hunter
    const bountyAmount = parseFloat(submission.Bounties.amount);
    const platformFee = Math.round((PLATFORM_FEE_FLAT + bountyAmount * PLATFORM_FEE_PERCENT) * 100); // in cents ($2 + 5%)
    const payoutAmount = Math.round(bountyAmount * 100) - platformFee; // in cents

    logStep("Calculated payout amounts", {
      bountyAmount: bountyAmount,
      platformFeePercent: `${PLATFORM_FEE_PERCENT * 100}%`,
      platformFee: platformFee / 100,
      payoutAmount: payoutAmount / 100
    });

    // ============================================================
    // CAPTURE PAYMENT - Now we have the lock, safe to capture
    // ============================================================
    try {
      // Use the payment_intent_id from the lock result for consistency
      const paymentIntentId = lockRow.payment_intent_id || escrowTx.stripe_payment_intent_id;
      
      // First, check the PaymentIntent status in Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      logStep("PaymentIntent status from Stripe", { 
        status: paymentIntent.status,
        capturable: paymentIntent.amount_capturable
      });

      let capturedIntent = paymentIntent;

      // Only capture if it's in requires_capture status
      if (paymentIntent.status === 'requires_capture') {
        logStep("Capturing PaymentIntent...");
        capturedIntent = await stripe.paymentIntents.capture(paymentIntentId);
        logStep("PaymentIntent captured successfully", { status: capturedIntent.status });
      } else if (paymentIntent.status === 'succeeded') {
        logStep("PaymentIntent already succeeded - no capture needed");
      } else {
        // Status is something else (canceled, requires_payment_method, etc.)
        throw new Error(`PaymentIntent is in invalid state for capture: ${paymentIntent.status}`);
      }

      // ============================================================
      // SUCCESS: Mark as captured - funds now in platform balance
      // The 7-day hold and transfer to hunter happens separately
      // ============================================================

      const { error: successError } = await supabaseClient
        .from('escrow_transactions')
        .update({ 
          capture_status: 'captured',
          captured_at: new Date().toISOString(),
          status: 'captured',
          payout_method: 'stripe', // Using Stripe Connect transfers
          platform_fee_amount: platformFee / 100,
          capture_error: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowTx.id)
        .eq('capture_lock_id', lockId); // Only update if we still hold the lock

      if (successError) {
        logStep("Warning: Failed to mark as captured, but Stripe capture succeeded", { successError });
        // Don't throw here - Stripe capture succeeded, which is what matters
      }

      logStep("Payout processing complete - funds captured", {
        escrowId: escrowTx.id,
        capturedAt: new Date().toISOString(),
        hunterConnectId: hunterProfile.stripe_connect_account_id,
        payoutAmount: payoutAmount / 100
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Payment captured. Funds will be transferred to hunter after 7-day hold period.',
        payout_method: 'stripe',
        escrow_captured: true,
        bounty_amount: bountyAmount,
        amount: payoutAmount / 100,
        platform_fee: platformFee / 100,
        hunter_connect_id: hunterProfile.stripe_connect_account_id,
        captured_at: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } catch (captureError: any) {
      // ============================================================
      // FAILURE: Mark as capture_failed with error, release lock
      // ============================================================
      logStep("Capture failed", { message: captureError.message });

      await supabaseClient
        .from('escrow_transactions')
        .update({ 
          capture_status: 'capture_failed',
          capture_error: captureError.message,
          capture_lock_id: null, // Release the lock
          capture_locked_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowTx.id)
        .eq('capture_lock_id', lockId);

      throw new Error(`Failed to capture payment: ${captureError.message}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-payout", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});