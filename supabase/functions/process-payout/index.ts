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
    logStep("Process payout function started - DESTINATION CHARGE WITH ON_BEHALF_OF MODEL");

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

    // CRITICAL: Check if already charged - idempotency check
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
      status: escrowTx.status,
      captureStatus: escrowTx.capture_status,
      amount: escrowTx.amount,
      hasPaymentMethod: !!escrowTx.stripe_payment_method_id,
      hasPaymentIntent: !!escrowTx.stripe_payment_intent_id
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
    // ATOMIC LOCK via RPC
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

    logStep("Acquired capture lock via RPC", { lockId });

    // Calculate payout amounts
    const bountyAmount = parseFloat(submission.Bounties.amount);
    const platformFee = Math.round((PLATFORM_FEE_FLAT + bountyAmount * PLATFORM_FEE_PERCENT) * 100); // in cents
    const hunterPayout = Math.round(bountyAmount * 100) - platformFee; // HUNTER GETS: bounty - platform fee (in cents)
    
    // Stripe fee: 3.5% + $0.30 (simple calculation to match frontend display)
    const STRIPE_FEE_RATE = 0.035; // 3.5% = 2.9% Stripe + 0.5% Connect fee + buffer
    const STRIPE_FIXED_FEE = 0.30;
    const stripeFee = Math.round((bountyAmount * STRIPE_FEE_RATE + STRIPE_FIXED_FEE) * 100); // in cents
    const totalChargeAmount = Math.round(bountyAmount * 100) + stripeFee; // bounty + stripe fee in cents

    logStep("Calculated payout amounts", {
      bountyAmount,
      platformFee: platformFee / 100,
      stripeFee: stripeFee / 100,
      totalChargeAmount: totalChargeAmount / 100,
      hunterPayout: hunterPayout / 100 // $100 - $7 = $93
    });

    // ============================================================
    // DESTINATION CHARGE WITH ON_BEHALF_OF MODEL
    // - application_fee_amount = YOUR platform fee (shows in Collected fees!)
    // - on_behalf_of = connected account (Stripe fees come from hunter's portion)
    // - Hunter gets: total charge - application_fee - Stripe's processing fee
    // ============================================================
    try {
      let paymentIntentId = '';
      let chargedAmount = 0;
      let transferId = '';

      // Check if this is SAVE CARD MODEL (has payment_method_id) or LEGACY (has payment_intent_id)
      if (escrowTx.stripe_payment_method_id && escrowTx.status === 'card_saved') {
        logStep("Using SAVE CARD model with DESTINATION CHARGE + ON_BEHALF_OF");
        
        // Get customer from the payment method
        const paymentMethod = await stripe.paymentMethods.retrieve(escrowTx.stripe_payment_method_id);
        const customerId = paymentMethod.customer as string;

        if (!customerId) {
          throw new Error("No customer found for payment method");
        }

        // Calculate what we need to charge so hunter nets exactly hunterPayout after Stripe takes their fee
        // With on_behalf_of, Stripe fee is taken from (total - application_fee)
        // Hunter gets: (total - application_fee) - stripe_fee
        // We want hunter to get hunterPayout, so:
        // hunterPayout = (total - platformFee) - stripe_fee
        // total - platformFee = hunterPayout + stripe_fee
        // But stripe_fee depends on total... so we need to solve for total
        
        // Stripe fee formula: 2.9% + $0.30 (standard) or 2.9% + 0.5% (Connect) + $0.30
        // Let's use 3.4% + $0.30 to be safe (includes Connect fee)
        // stripe_fee = 0.034 * total + 0.30
        // hunterPayout = total - platformFee - (0.034 * total + 0.30)
        // hunterPayout = total - platformFee - 0.034 * total - 0.30
        // hunterPayout = total * (1 - 0.034) - platformFee - 0.30
        // hunterPayout = total * 0.966 - platformFee - 0.30
        // total = (hunterPayout + platformFee + 0.30) / 0.966
        
        const STRIPE_FEE_RATE = 0.034; // 3.4% (2.9% + 0.5% Connect)
        const STRIPE_FIXED_FEE = 30; // 30 cents
        
        // Calculate total charge needed for hunter to net exactly hunterPayout
        const totalNeeded = Math.ceil((hunterPayout + platformFee + STRIPE_FIXED_FEE) / (1 - STRIPE_FEE_RATE));
        
        logStep("Calculated charge with on_behalf_of", {
          hunterPayout: hunterPayout / 100,
          platformFee: platformFee / 100,
          totalNeeded: totalNeeded / 100,
          stripeFeeEstimate: (totalNeeded * STRIPE_FEE_RATE + STRIPE_FIXED_FEE) / 100
        });

        // Create PaymentIntent with destination charge + on_behalf_of
        // This puts YOUR platform fee in "Collected fees" and Stripe fees come from hunter's portion
        const paymentIntent = await stripe.paymentIntents.create({
          amount: totalNeeded, // Total charge to poster
          currency: escrowTx.currency || 'usd',
          customer: customerId,
          payment_method: escrowTx.stripe_payment_method_id,
          off_session: true,
          confirm: true,
          description: `Bounty payment: ${submission.Bounties.title}`,
          // YOUR platform fee - this goes to "Collected fees" in Stripe!
          application_fee_amount: platformFee,
          // on_behalf_of makes Stripe fees come from connected account's portion
          on_behalf_of: hunterProfile.stripe_connect_account_id,
          // Destination for the funds
          transfer_data: {
            destination: hunterProfile.stripe_connect_account_id,
          },
          metadata: {
            bounty_id: submission.bounty_id,
            submission_id: submissionId,
            hunter_id: submission.hunter_id,
            poster_id: submission.Bounties.poster_id,
            bounty_amount: bountyAmount.toString(),
            platform_fee: (platformFee / 100).toFixed(2),
            hunter_payout: (hunterPayout / 100).toFixed(2),
            type: 'bounty_payment'
          }
        });

        if (paymentIntent.status !== 'succeeded') {
          throw new Error(`Payment failed. Status: ${paymentIntent.status}`);
        }

        // Get the transfer ID from the payment intent
        const transfers = await stripe.transfers.list({
          limit: 1,
          transfer_group: paymentIntent.transfer_group || undefined,
        });
        transferId = transfers.data[0]?.id || '';

        logStep("Destination charge with on_behalf_of successful", { 
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          totalCharged: totalNeeded / 100,
          applicationFee: platformFee / 100, // YOUR fee in Collected fees!
          hunterGets: (totalNeeded - platformFee) / 100, // Before Stripe fee
          transferId
        });

        paymentIntentId = paymentIntent.id;
        chargedAmount = totalNeeded;

      } else if (escrowTx.stripe_payment_intent_id && escrowTx.stripe_payment_intent_id !== '') {
        // LEGACY MODEL: Capture the existing PaymentIntent
        // Note: Legacy payments won't have destination charges set up
        logStep("Using LEGACY model - capturing authorized payment (no destination charge)");
        
        const paymentIntent = await stripe.paymentIntents.retrieve(escrowTx.stripe_payment_intent_id);
        
        if (paymentIntent.status === 'requires_capture') {
          const capturedIntent = await stripe.paymentIntents.capture(escrowTx.stripe_payment_intent_id);
          logStep("PaymentIntent captured successfully", { status: capturedIntent.status });
          chargedAmount = capturedIntent.amount;
          paymentIntentId = capturedIntent.id;
        } else if (paymentIntent.status === 'succeeded') {
          logStep("PaymentIntent already succeeded");
          chargedAmount = paymentIntent.amount;
          paymentIntentId = paymentIntent.id;
        } else {
          throw new Error(`PaymentIntent is in invalid state: ${paymentIntent.status}`);
        }
      } else {
        throw new Error("No payment method or payment intent found for this escrow");
      }

      // ============================================================
      // SUCCESS: Mark as captured
      // Destination charge with on_behalf_of: platform fee in Collected fees!
      // ============================================================
      const { error: successError } = await supabaseClient
        .from('escrow_transactions')
        .update({ 
          stripe_payment_intent_id: paymentIntentId,
          capture_status: 'captured',
          captured_at: new Date().toISOString(),
          status: 'captured',
          payout_method: 'stripe_destination_on_behalf_of',
          platform_fee_amount: platformFee / 100, // YOUR platform fee (in Collected fees!)
          payout_sent_amount: hunterPayout / 100, // What hunter nets after Stripe fee
          total_charged_amount: chargedAmount / 100, // What poster paid
          charge_attempted_at: new Date().toISOString(),
          capture_error: null,
          manual_payout_status: 'completed',
          manual_payout_reference: transferId,
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowTx.id)
        .eq('capture_lock_id', lockId);

      if (successError) {
        logStep("Warning: Failed to mark as captured, but charge succeeded", { successError });
      }

      logStep("Payout processing complete - ON_BEHALF_OF MODEL", {
        escrowId: escrowTx.id,
        chargedAmount: chargedAmount / 100,
        platformFee: platformFee / 100, // YOUR fee (in Collected fees!)
        hunterPayout: hunterPayout / 100,
        transferId: transferId,
        hunterConnectId: hunterProfile.stripe_connect_account_id
      });

      // ============================================================
      // UPDATE REFERRAL STATUS: Mark hunter's referral as 'converted'
      // This enables partner earnings to be calculated
      // ============================================================
      try {
        const { data: hunterReferral } = await supabaseClient
          .from('referrals')
          .select('id, status')
          .eq('referred_id', submission.hunter_id)
          .maybeSingle();

        if (hunterReferral && hunterReferral.status === 'signed_up') {
          await supabaseClient
            .from('referrals')
            .update({
              status: 'converted',
              converted_at: new Date().toISOString(),
              first_bounty_completed_at: new Date().toISOString()
            })
            .eq('id', hunterReferral.id);

          logStep("Referral converted to 'converted' status", { 
            hunterId: submission.hunter_id,
            referralId: hunterReferral.id 
          });
        }
      } catch (referralError) {
        // Don't fail payout if referral update fails - just log it
        logStep("Warning: Failed to update referral status", { error: referralError });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Payment captured. Platform fee is in Collected fees!',
        payout_method: 'stripe_destination_on_behalf_of',
        escrow_captured: true,
        bounty_amount: bountyAmount,
        total_charged: chargedAmount / 100,
        platform_fee: platformFee / 100, // YOUR fee (shows in Collected fees!)
        hunter_receives: hunterPayout / 100, // What hunter nets after Stripe fee
        transfer_id: transferId,
        hunter_connect_id: hunterProfile.stripe_connect_account_id,
        captured_at: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } catch (chargeError: any) {
      // ============================================================
      // FAILURE: Mark as charge_failed, release lock
      // ============================================================
      logStep("Charge failed", { message: chargeError.message });

      await supabaseClient
        .from('escrow_transactions')
        .update({ 
          capture_status: 'capture_failed',
          capture_error: chargeError.message,
          charge_failed_reason: chargeError.message,
          charge_attempted_at: new Date().toISOString(),
          capture_lock_id: null,
          capture_locked_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowTx.id)
        .eq('capture_lock_id', lockId);

      throw new Error('Payment charge failed');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-payout", { message: errorMessage });
    // Return generic error to client, keep details in server logs
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Payout processing failed',
      code: 'PAYOUT_ERROR'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
