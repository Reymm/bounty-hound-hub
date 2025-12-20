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

// Platform fee: 7% from hunter's payout
const PLATFORM_FEE_PERCENT = 0.07;

// Countries that require manual payout (CA platform cannot pay out to these via Stripe Connect)
// Canadian Stripe platforms can only pay Canadian connected accounts
const MANUAL_PAYOUT_COUNTRIES = ['US'];

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

    logStep("Found escrow transaction", {
      escrowId: escrowTx.id,
      paymentIntentId: escrowTx.stripe_payment_intent_id,
      status: escrowTx.status,
      amount: escrowTx.amount
    });

    // First, capture the PaymentIntent if it's in requires_capture status
    if (escrowTx.status === 'requires_capture') {
      logStep("Capturing PaymentIntent...");
      
      try {
        const capturedIntent = await stripe.paymentIntents.capture(escrowTx.stripe_payment_intent_id);
        logStep("PaymentIntent captured", { status: capturedIntent.status });

        // Update escrow status
        await supabaseClient
          .from('escrow_transactions')
          .update({ status: 'captured' })
          .eq('id', escrowTx.id);
      } catch (captureError: any) {
        logStep("Capture error", { message: captureError.message });
        throw new Error(`Failed to capture payment: ${captureError.message}`);
      }
    } else if (escrowTx.status !== 'captured' && escrowTx.status !== 'succeeded') {
      throw new Error(`Escrow is in invalid state for payout: ${escrowTx.status}`);
    }

    // Get hunter's profile including Connect account and country
    const { data: hunterProfile } = await supabaseClient
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_payouts_enabled, full_name, username, payout_country, payout_email')
      .eq('id', submission.hunter_id)
      .maybeSingle();

    // Calculate payout amounts - 7% platform fee from hunter
    const bountyAmount = parseFloat(submission.Bounties.amount);
    const platformFee = Math.round(bountyAmount * PLATFORM_FEE_PERCENT * 100); // in cents
    const payoutAmount = Math.round(bountyAmount * 100) - platformFee; // in cents

    logStep("Calculated payout amounts", {
      bountyAmount: bountyAmount,
      platformFeePercent: `${PLATFORM_FEE_PERCENT * 100}%`,
      platformFee: platformFee / 100,
      payoutAmount: payoutAmount / 100
    });

    // Determine if this requires manual payout based on hunter's country
    const hunterCountry = hunterProfile?.payout_country || 'CA'; // Default to CA if not set
    const requiresManualPayout = MANUAL_PAYOUT_COUNTRIES.includes(hunterCountry);

    logStep("Payout method determination", {
      hunterCountry,
      requiresManualPayout
    });

    // If hunter is in a country requiring manual payout, mark for manual processing
    if (requiresManualPayout) {
      logStep("Setting up manual payout for US hunter");
      
      await supabaseClient
        .from('escrow_transactions')
        .update({ 
          status: 'captured',
          payout_method: 'manual',
          manual_payout_status: 'pending',
          platform_fee_amount: platformFee / 100,
          hunter_payout_email: hunterProfile?.payout_email || null,
          hunter_country: hunterCountry
        })
        .eq('id', escrowTx.id);

      return new Response(JSON.stringify({
        success: true,
        message: 'Payment captured. Manual payout required for US hunter.',
        payout_method: 'manual',
        manual_payout_required: true,
        escrow_captured: true,
        bounty_amount: bountyAmount,
        amount: payoutAmount / 100,
        platform_fee: platformFee / 100,
        platform_fee_percent: PLATFORM_FEE_PERCENT * 100,
        hunter_country: hunterCountry
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // For CA hunters - proceed with Stripe Connect auto payout
    if (!hunterProfile?.stripe_connect_account_id) {
      logStep("Hunter missing Connect account", { hunterId: submission.hunter_id });
      return new Response(JSON.stringify({
        success: true,
        message: 'Payment captured. Hunter needs to set up Stripe Connect to receive payout.',
        escrow_captured: true,
        transfer_pending: true,
        bounty_amount: bountyAmount,
        amount: payoutAmount / 100,
        platform_fee: platformFee / 100,
        platform_fee_percent: PLATFORM_FEE_PERCENT * 100
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!hunterProfile.stripe_connect_payouts_enabled) {
      logStep("Hunter Connect not ready for payouts");
      return new Response(JSON.stringify({
        success: true,
        message: 'Payment captured. Hunter needs to complete Connect onboarding to receive payout.',
        escrow_captured: true,
        transfer_pending: true,
        bounty_amount: bountyAmount,
        amount: payoutAmount / 100,
        platform_fee: platformFee / 100,
        platform_fee_percent: PLATFORM_FEE_PERCENT * 100
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Hunter has valid Connect account", { 
      accountId: hunterProfile.stripe_connect_account_id 
    });

    // Create transfer to Connect account (CA hunters only)
    const transfer = await stripe.transfers.create({
      amount: payoutAmount,
      currency: 'usd',
      destination: hunterProfile.stripe_connect_account_id,
      description: `Bounty payout for: ${submission.Bounties.title}`,
      metadata: {
        submission_id: submission.id,
        bounty_id: submission.bounty_id,
        hunter_id: submission.hunter_id,
        bounty_amount: bountyAmount.toString(),
        platform_fee: (platformFee / 100).toString(),
        platform_fee_percent: (PLATFORM_FEE_PERCENT * 100).toString()
      }
    });

    logStep("Transfer created successfully", { 
      transferId: transfer.id,
      amount: transfer.amount / 100
    });

    // Update escrow status to completed and record the platform fee
    await supabaseClient
      .from('escrow_transactions')
      .update({ 
        status: 'completed',
        payout_method: 'stripe',
        platform_fee_amount: platformFee / 100
      })
      .eq('id', escrowTx.id);

    return new Response(JSON.stringify({
      success: true,
      payout_method: 'stripe',
      transfer_id: transfer.id,
      bounty_amount: bountyAmount,
      amount: payoutAmount / 100,
      platform_fee: platformFee / 100,
      platform_fee_percent: PLATFORM_FEE_PERCENT * 100,
      hunter_account: hunterProfile.stripe_connect_account_id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

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