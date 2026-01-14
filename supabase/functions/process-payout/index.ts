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
    logStep("Process payout function started - SEPARATE CHARGE + TRANSFER MODEL");

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
    // POSTER PAYS STRIPE FEES - Platform keeps full $52, hunter gets exactly bounty - platform fee
    const bountyAmount = parseFloat(submission.Bounties.amount);
    const platformFeeDollars = PLATFORM_FEE_FLAT + bountyAmount * PLATFORM_FEE_PERCENT; // $52 for $1000 bounty
    const platformFeeCents = Math.round(platformFeeDollars * 100); // Platform's $52 in cents
    const hunterPayoutCents = Math.round(bountyAmount * 100) - platformFeeCents; // Hunter gets: $1000 - $52 = $948 in cents
    
    // Stripe fee: 2.9% + $0.30 on total charge
    // We need to gross up so that after Stripe takes their fee, we have exactly:
    // - platformFeeCents for platform
    // - hunterPayoutCents for hunter
    // Formula: totalCharge = (hunterPayout + platformFee + 0.30) / (1 - 0.029)
    const STRIPE_PERCENT = 0.029;
    const STRIPE_FLAT_CENTS = 30;
    
    // Calculate total charge so poster covers Stripe fees
    const baseAmountCents = hunterPayoutCents + platformFeeCents; // $1000 in cents
    const totalChargeCents = Math.ceil((baseAmountCents + STRIPE_FLAT_CENTS) / (1 - STRIPE_PERCENT));
    const stripeFeeCents = Math.ceil(totalChargeCents * STRIPE_PERCENT + STRIPE_FLAT_CENTS);
    
    // Application fee = platform fee + Stripe fee (so Stripe takes from this, platform nets $52)
    const applicationFeeCents = platformFeeCents + stripeFeeCents;

    logStep("Calculated payout amounts - POSTER PAYS STRIPE FEES", {
      bountyAmount,
      platformFee: platformFeeCents / 100,
      stripeFee: stripeFeeCents / 100,
      totalCharge: totalChargeCents / 100,
      applicationFee: applicationFeeCents / 100,
      hunterPayout: hunterPayoutCents / 100,
      platformNets: (applicationFeeCents - stripeFeeCents) / 100
    });

    // ============================================================
    // DESTINATION CHARGE MODEL with transfer_data.amount
    // - Poster pays: bounty + Stripe fees (~$1030.18)
    // - Hunter receives: $948 exactly (via explicit transfer_data.amount)
    // - Platform keeps: $52 (shows in "Destination Platform Fee" exports)
    // - Stripe takes: ~$30.18 processing fee
    // ============================================================
    try {
      let paymentIntentId = '';
      let chargedAmount = 0;

      // Check if this is SAVE CARD MODEL (has payment_method_id) or LEGACY (has payment_intent_id)
      if (escrowTx.stripe_payment_method_id && escrowTx.status === 'card_saved') {
        logStep("Using SAVE CARD model with DESTINATION CHARGE");
        
        // Get customer from the payment method
        const paymentMethod = await stripe.paymentMethods.retrieve(escrowTx.stripe_payment_method_id);
        const customerId = paymentMethod.customer as string;

        if (!customerId) {
          throw new Error("No customer found for payment method");
        }

        logStep("Destination charge - poster pays Stripe fees, explicit hunter transfer", {
          chargeAmount: totalChargeCents / 100,
          stripeFee: stripeFeeCents / 100,
          platformFee: platformFeeCents / 100,
          hunterReceives: hunterPayoutCents / 100
        });

        // DESTINATION CHARGE MODEL (without on_behalf_of):
        // - Charge poster: bounty + Stripe fees (~$1030)
        // - transfer_data.destination: hunter's connect account
        // - transfer_data.amount: explicit amount hunter receives ($948)
        // - Platform receives: totalCharge - hunterPayout - stripeFee = $52
        // 
        // With explicit transfer_data.amount:
        // - Poster pays: $1030.18 (covers bounty + Stripe fees)
        // - Stripe takes: ~$30.18
        // - Hunter receives: $948 exactly
        // - Platform keeps: $52 (the difference after hunter payout and Stripe fee)
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: totalChargeCents, // Charge poster bounty + Stripe fees (~$1030)
          currency: escrowTx.currency || 'usd',
          customer: customerId,
          payment_method: escrowTx.stripe_payment_method_id,
          off_session: true,
          confirm: true,
          description: `Bounty payment: ${submission.Bounties.title}`,
          // Destination charge with explicit transfer amount
          transfer_data: {
            destination: hunterProfile.stripe_connect_account_id,
            amount: hunterPayoutCents, // Hunter receives exactly $948
          },
          metadata: {
            bounty_id: submission.bounty_id,
            submission_id: submissionId,
            hunter_id: submission.hunter_id,
            poster_id: submission.Bounties.poster_id,
            bounty_amount: bountyAmount.toString(),
            poster_charged: (totalChargeCents / 100).toFixed(2),
            stripe_fee: (stripeFeeCents / 100).toFixed(2),
            platform_fee: (platformFeeCents / 100).toFixed(2),
            hunter_payout: (hunterPayoutCents / 100).toFixed(2),
            type: 'bounty_payment'
          }
        });

        if (paymentIntent.status !== 'succeeded') {
          throw new Error(`Payment failed. Status: ${paymentIntent.status}`);
        }

        logStep("Destination charge successful", { 
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          posterCharged: totalChargeCents / 100,
          stripeFee: stripeFeeCents / 100,
          platformKeeps: platformFeeCents / 100,
          hunterReceives: hunterPayoutCents / 100
        });

        paymentIntentId = paymentIntent.id;
        chargedAmount = totalChargeCents;

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
      // Destination charge: Platform keeps $52, hunter gets $948
      // ============================================================
      const { error: successError } = await supabaseClient
        .from('escrow_transactions')
        .update({ 
          stripe_payment_intent_id: paymentIntentId,
          capture_status: 'captured',
          captured_at: new Date().toISOString(),
          status: 'captured',
          payout_method: 'stripe_destination_explicit',
          platform_fee_amount: platformFeeCents / 100, // Platform keeps exactly $52
          payout_sent_amount: hunterPayoutCents / 100, // Hunter receives exactly $948
          total_charged_amount: chargedAmount / 100, // Poster paid bounty amount
          charge_attempted_at: new Date().toISOString(),
          capture_error: null,
          manual_payout_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowTx.id)
        .eq('capture_lock_id', lockId);

      if (successError) {
        logStep("Warning: Failed to mark as captured, but charge succeeded", { successError });
      }

      logStep("Payout processing complete - DESTINATION CHARGE MODEL", {
        escrowId: escrowTx.id,
        posterCharged: chargedAmount / 100,
        platformKeeps: platformFeeCents / 100,
        hunterReceived: hunterPayoutCents / 100,
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
        message: 'Payment captured via destination charge. Hunter receives explicit amount!',
        payout_method: 'stripe_destination_explicit',
        escrow_captured: true,
        bounty_amount: bountyAmount,
        poster_charged: chargedAmount / 100,
        platform_keeps: platformFeeCents / 100, // Platform keeps $52 (minus Stripe fees)
        hunter_receives: hunterPayoutCents / 100, // Hunter gets exactly $948
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
