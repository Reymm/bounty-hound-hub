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

    // Get submission details
    const { data: submission, error: submissionError } = await supabaseClient
      .from('Submissions')
      .select(`
        id,
        hunter_id,
        bounty_id,
        status,
        Bounties!inner(
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
      bountyAmount: submission.Bounties.amount
    });

    // Get hunter's Connect account
    const { data: hunterProfile } = await supabaseClient
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_payouts_enabled, full_name')
      .eq('id', submission.hunter_id)
      .maybeSingle();

    if (!hunterProfile?.stripe_connect_account_id) {
      throw new Error('Hunter does not have a Stripe Connect account');
    }

    if (!hunterProfile.stripe_connect_payouts_enabled) {
      throw new Error('Hunter has not completed Connect onboarding');
    }

    logStep("Hunter has valid Connect account", { 
      accountId: hunterProfile.stripe_connect_account_id 
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Deduct 2.3% platform fee from hunter's payout
    // Poster also pays 2.3% (collected during escrow creation)
    const bountyAmount = parseFloat(submission.Bounties.amount);
    const platformFeePercent = 0.023; // 2.3%
    const platformFee = Math.round(bountyAmount * platformFeePercent * 100); // in cents
    const payoutAmount = Math.round(bountyAmount * 100) - platformFee; // in cents

    logStep("Calculated payout amounts", {
      bountyAmount: bountyAmount,
      platformFee: platformFee / 100,
      payoutAmount: payoutAmount / 100,
      note: 'Both poster and hunter pay 2.3% platform fee'
    });

    // Create transfer to Connect account (bounty amount minus 2.3% platform fee)
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
        platform_fee: (platformFee / 100).toString()
      }
    });

    logStep("Transfer created successfully", { 
      transferId: transfer.id,
      amount: transfer.amount / 100
    });

    // TODO: Store payout record in database for tracking
    // You might want to create a payouts table to track all payouts

    return new Response(JSON.stringify({
      success: true,
      transfer_id: transfer.id,
      amount: payoutAmount / 100,
      platform_fee: platformFee / 100,
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
