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
    logStep("Process payout function started - SEPARATE CHARGES AND TRANSFERS MODEL");

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

    // Get hunter's profile including Connect account and referral partner
    const { data: hunterProfile } = await supabaseClient
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_onboarding_complete, stripe_connect_payouts_enabled, full_name, username, referred_by')
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

    // ============================================================
    // CALCULATE AMOUNTS
    // ============================================================
    const bountyAmount = parseFloat(submission.Bounties.amount);
    const bountyAmountCents = Math.round(bountyAmount * 100);
    
    // Platform fee: $2 + 5% from bounty
    const platformFeeDollars = PLATFORM_FEE_FLAT + bountyAmount * PLATFORM_FEE_PERCENT;
    const platformFeeCents = Math.round(platformFeeDollars * 100);
    
    // Hunter gets: bounty - platform fee
    const hunterPayoutCents = bountyAmountCents - platformFeeCents;
    
    // Use pre-calculated charge amount from escrow, or calculate as fallback
    let totalChargeCents: number;
    let stripeFeeCents: number;
    
    if (escrowTx.total_charge_amount && escrowTx.stripe_fee_amount) {
      totalChargeCents = Math.round(parseFloat(escrowTx.total_charge_amount) * 100);
      stripeFeeCents = Math.round(parseFloat(escrowTx.stripe_fee_amount) * 100);
      logStep("Using PRE-CALCULATED amounts from escrow", {
        source: 'escrow_record',
        totalCharge: totalChargeCents / 100,
        stripeFee: stripeFeeCents / 100
      });
    } else {
      // FALLBACK: calculate Stripe fee
      const STRIPE_PERCENT = 0.037;
      const STRIPE_FLAT_CENTS = 30;
      totalChargeCents = Math.ceil((bountyAmountCents + STRIPE_FLAT_CENTS) / (1 - STRIPE_PERCENT));
      stripeFeeCents = totalChargeCents - bountyAmountCents;
      logStep("FALLBACK: Calculated Stripe fee", {
        source: 'calculated_fallback',
        totalCharge: totalChargeCents / 100,
        stripeFee: stripeFeeCents / 100
      });
    }

    logStep("Payout amounts calculated - SEPARATE CHARGES AND TRANSFERS", {
      bountyAmount,
      totalCharge: totalChargeCents / 100,
      stripeFee: stripeFeeCents / 100,
      platformFee: platformFeeCents / 100,
      hunterPayout: hunterPayoutCents / 100
    });

    // ============================================================
    // SEPARATE CHARGES AND TRANSFERS MODEL
    // 
    // Step 1: Charge poster's card (funds go to YOUR platform account)
    // Step 2: Create a separate Transfer to hunter for (bounty - platform fee)
    // 
    // This way:
    // - Platform keeps the $7 fee BEFORE any transfer
    // - Hunter only receives $93 (not $100 minus fee after)
    // ============================================================
    try {
      let paymentIntentId = '';
      let chargedAmount = 0;
      let transferId = '';

      if (escrowTx.stripe_payment_method_id && escrowTx.status === 'card_saved') {
        logStep("Using TRUE SEPARATE CHARGES AND TRANSFERS model");
        
        // Get customer from the payment method
        const paymentMethod = await stripe.paymentMethods.retrieve(escrowTx.stripe_payment_method_id);
        const customerId = paymentMethod.customer as string;

        if (!customerId) {
          throw new Error("No customer found for payment method");
        }

        // ============================================================
        // STEP 1: CHARGE THE POSTER (funds go to YOUR platform account)
        // NO transfer_data, NO application_fee - just a regular charge
        // ============================================================
        logStep("Step 1: Charging poster (funds go to PLATFORM account)", {
          chargeAmount: totalChargeCents / 100
        });

        const paymentIntent = await stripe.paymentIntents.create({
          amount: totalChargeCents, // Poster pays bounty + Stripe fees
          currency: escrowTx.currency || 'usd',
          customer: customerId,
          payment_method: escrowTx.stripe_payment_method_id,
          off_session: true,
          confirm: true,
          description: `Bounty payment: ${submission.Bounties.title}`,
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
            type: 'bounty_payment',
            model: 'separate_charges_and_transfers'
          }
        });

        if (paymentIntent.status !== 'succeeded') {
          throw new Error(`Payment failed. Status: ${paymentIntent.status}`);
        }

        paymentIntentId = paymentIntent.id;
        chargedAmount = totalChargeCents;

        logStep("Step 1 COMPLETE: Poster charged, funds in platform account", {
          paymentIntentId: paymentIntent.id,
          chargedAmount: chargedAmount / 100,
          status: paymentIntent.status
        });

        // ============================================================
        // STEP 2: TRANSFER TO HUNTER (bounty - platform fee)
        // Platform already keeps the $7 - only send $93 to hunter
        // ============================================================
        logStep("Step 2: Creating separate transfer to hunter", {
          transferAmount: hunterPayoutCents / 100,
          destination: hunterProfile.stripe_connect_account_id
        });

        const transfer = await stripe.transfers.create({
          amount: hunterPayoutCents, // $93 = bounty ($100) - platform fee ($7)
          currency: escrowTx.currency || 'usd',
          destination: hunterProfile.stripe_connect_account_id,
          description: `Bounty payout: ${submission.Bounties.title}`,
          source_transaction: paymentIntent.latest_charge as string, // Link to the charge
          metadata: {
            bounty_id: submission.bounty_id,
            submission_id: submissionId,
            hunter_id: submission.hunter_id,
            poster_id: submission.Bounties.poster_id,
            bounty_amount: bountyAmount.toString(),
            platform_fee_retained: (platformFeeCents / 100).toFixed(2),
            type: 'bounty_payout',
            model: 'separate_charges_and_transfers'
          }
        });

        transferId = transfer.id;

        logStep("Step 2 COMPLETE: Transfer created to hunter", {
          transferId: transfer.id,
          transferAmount: transfer.amount / 100,
          destination: transfer.destination
        });

        logStep("SEPARATE CHARGES AND TRANSFERS - SUCCESS", {
          posterCharged: totalChargeCents / 100,
          platformRetained: platformFeeCents / 100,
          hunterReceived: hunterPayoutCents / 100,
          paymentIntentId: paymentIntent.id,
          transferId: transfer.id
        });

      } else if (escrowTx.stripe_payment_intent_id && escrowTx.stripe_payment_intent_id !== '') {
        // LEGACY MODEL: Capture the existing PaymentIntent
        logStep("Using LEGACY model - capturing authorized payment");
        
        const paymentIntent = await stripe.paymentIntents.retrieve(escrowTx.stripe_payment_intent_id);
        
        if (paymentIntent.status === 'requires_capture') {
          const capturedIntent = await stripe.paymentIntents.capture(escrowTx.stripe_payment_intent_id);
          logStep("PaymentIntent captured successfully", { status: capturedIntent.status });
          chargedAmount = capturedIntent.amount;
          paymentIntentId = capturedIntent.id;
          
          // For legacy, also create a transfer
          const transfer = await stripe.transfers.create({
            amount: hunterPayoutCents,
            currency: escrowTx.currency || 'usd',
            destination: hunterProfile.stripe_connect_account_id,
            source_transaction: capturedIntent.latest_charge as string,
            metadata: {
              bounty_id: submission.bounty_id,
              type: 'bounty_payout_legacy'
            }
          });
          transferId = transfer.id;
          
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
      // SUCCESS: Mark as captured + store partner attribution
      // ============================================================
      
      // Get the partner ID if hunter was referred by a partner
      let referredByPartnerId: string | null = null;
      if (hunterProfile?.referred_by) {
        const { data: partnerCheck } = await supabaseClient
          .from('profiles')
          .select('id, is_partner')
          .eq('id', hunterProfile.referred_by)
          .eq('is_partner', true)
          .maybeSingle();
        
        if (partnerCheck) {
          referredByPartnerId = partnerCheck.id;
          logStep("Hunter was referred by partner", { partnerId: referredByPartnerId });
        }
      }
      
      const { error: successError } = await supabaseClient
        .from('escrow_transactions')
        .update({ 
          stripe_payment_intent_id: paymentIntentId,
          capture_status: 'captured',
          captured_at: new Date().toISOString(),
          status: 'captured',
          payout_method: 'separate_charges_and_transfers',
          platform_fee_amount: platformFeeCents / 100,
          payout_sent_amount: hunterPayoutCents / 100,
          total_charged_amount: chargedAmount / 100,
          charge_attempted_at: new Date().toISOString(),
          capture_error: null,
          manual_payout_status: 'confirmed',
          referred_by_partner_id: referredByPartnerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowTx.id)
        .eq('capture_lock_id', lockId);

      if (successError) {
        logStep("Warning: Failed to mark as captured, but charge succeeded", { successError });
      }

      // Update referral status if applicable
      const { data: referral } = await supabaseClient
        .from('referrals')
        .select('id, status, referrer_id')
        .eq('referred_id', submission.hunter_id)
        .eq('status', 'converted')
        .maybeSingle();

      if (referral) {
        await supabaseClient
          .from('referrals')
          .update({
            status: 'completed',
            first_bounty_completed_at: new Date().toISOString()
          })
          .eq('id', referral.id);

        logStep("Updated referral status to completed", { referralId: referral.id });
      }

      logStep("Payout processing complete - SEPARATE CHARGES AND TRANSFERS", {
        escrowId: escrowTx.id,
        posterCharged: chargedAmount / 100,
        platformFeeRetained: platformFeeCents / 100,
        hunterTransferred: hunterPayoutCents / 100,
        transferId: transferId,
        hunterConnectId: hunterProfile.stripe_connect_account_id
      });

      return new Response(JSON.stringify({
        success: true,
        model: 'separate_charges_and_transfers',
        poster_charged: chargedAmount / 100,
        platform_fee_retained: platformFeeCents / 100,
        hunter_received: hunterPayoutCents / 100,
        stripe_fee: stripeFeeCents / 100,
        payment_intent_id: paymentIntentId,
        transfer_id: transferId
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } catch (stripeError: any) {
      logStep("STRIPE ERROR during payout", { 
        errorMessage: stripeError.message,
        errorType: stripeError.type,
        errorCode: stripeError.code
      });

      // Mark capture as failed
      await supabaseClient
        .from('escrow_transactions')
        .update({ 
          capture_status: 'capture_failed',
          capture_error: stripeError.message,
          charge_failed_reason: stripeError.message,
          charge_attempted_at: new Date().toISOString(),
          capture_lock_id: null,
          capture_locked_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowTx.id)
        .eq('capture_lock_id', lockId);

      return new Response(JSON.stringify({
        success: false,
        error: stripeError.message,
        stripe_error_code: stripeError.code,
        stripe_error_type: stripeError.type
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

  } catch (error: any) {
    logStep("FATAL ERROR", { message: error.message, stack: error.stack });
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
