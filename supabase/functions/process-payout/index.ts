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

// All payouts are manual (via PayPal) - no Stripe Connect transfers

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
      .select('stripe_connect_account_id, stripe_connect_onboarding_complete, stripe_connect_payouts_enabled, full_name, username, payout_country, payout_email')
      .eq('id', submission.hunter_id)
      .maybeSingle();

    // CRITICAL: Require Stripe Connect onboarding to be complete before payout
    // This ensures every hunter who receives payment is ID-verified
    if (!hunterProfile?.stripe_connect_onboarding_complete) {
      logStep("Hunter has not completed Stripe Connect onboarding - blocking payout");
      return new Response(JSON.stringify({
        success: false,
        error: 'Hunter must complete identity verification before receiving payout',
        requires_verification: true,
        hunter_id: submission.hunter_id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Hunter is ID-verified via Stripe Connect", {
      connectAccountId: hunterProfile.stripe_connect_account_id,
      onboardingComplete: hunterProfile.stripe_connect_onboarding_complete
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

    // All payouts are manual via PayPal
    const hunterCountry = hunterProfile?.payout_country || 'Unknown';

    logStep("Setting up manual payout", {
      hunterCountry,
      payoutEmail: hunterProfile?.payout_email
    });
    
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
      message: 'Payment captured. Manual payout required.',
      payout_method: 'manual',
      manual_payout_required: true,
      escrow_captured: true,
      bounty_amount: bountyAmount,
      amount: payoutAmount / 100,
      platform_fee: platformFee / 100,
      hunter_country: hunterCountry
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