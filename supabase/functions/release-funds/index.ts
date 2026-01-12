import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RELEASE-FUNDS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Release funds function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate the poster
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get submission ID and early release flag from request
    const { submissionId, earlyRelease } = await req.json();
    if (!submissionId) throw new Error("Submission ID is required");
    logStep("Processing submission", { submissionId, earlyRelease: !!earlyRelease });

    // Get submission with bounty info
    const { data: submission, error: submissionError } = await supabaseClient
      .from('Submissions')
      .select(`
        id,
        hunter_id,
        bounty_id,
        status,
        accepted_at
      `)
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      throw new Error('Submission not found');
    }

    if (submission.status !== 'accepted') {
      throw new Error('Submission is not in accepted status');
    }
    logStep("Submission found", { hunterId: submission.hunter_id, bountyId: submission.bounty_id });

    // Get bounty to verify poster
    const { data: bounty, error: bountyError } = await supabaseClient
      .from('Bounties')
      .select('id, poster_id, title, amount')
      .eq('id', submission.bounty_id)
      .single();

    if (bountyError || !bounty) {
      throw new Error('Bounty not found');
    }

    // Verify the requester is the bounty poster
    if (bounty.poster_id !== user.id) {
      throw new Error('Only the bounty poster can release funds');
    }
    logStep("Poster verified", { bountyTitle: bounty.title });

    // Get escrow transaction
    const { data: escrow, error: escrowError } = await supabaseClient
      .from('escrow_transactions')
      .select('*')
      .eq('bounty_id', submission.bounty_id)
      .single();

    if (escrowError || !escrow) {
      throw new Error('Escrow transaction not found');
    }
    logStep("Escrow found", { 
      escrowId: escrow.id, 
      captureStatus: escrow.capture_status,
      eligibleAt: escrow.eligible_at,
      payoutFreeze: escrow.payout_freeze
    });

    // Validate escrow state
    if (escrow.capture_status !== 'captured') {
      throw new Error(`Payment not captured. Status: ${escrow.capture_status}`);
    }

    if (escrow.payout_freeze) {
      throw new Error(`Payout is frozen: ${escrow.payout_freeze_reason || 'Unknown reason'}`);
    }

    if (escrow.payout_method === 'stripe' && escrow.manual_payout_status === 'sent') {
      return new Response(JSON.stringify({
        success: false,
        already_released: true,
        message: 'Funds have already been released to the hunter'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check 7-day hold period (unless early release requested)
    const now = new Date();
    const eligibleAt = escrow.eligible_at ? new Date(escrow.eligible_at) : null;
    
    if (!eligibleAt) {
      throw new Error('Payout eligibility date not set');
    }

    const holdElapsed = now >= eligibleAt;
    const canRelease = holdElapsed || escrow.payout_hold_overridden || earlyRelease;

    if (!canRelease) {
      const hoursRemaining = Math.ceil((eligibleAt.getTime() - now.getTime()) / (1000 * 60 * 60));
      return new Response(JSON.stringify({
        success: false,
        hold_not_elapsed: true,
        eligible_at: escrow.eligible_at,
        hours_remaining: hoursRemaining,
        message: `Funds can be released in ${hoursRemaining} hours (after 7-day hold period)`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // If early release, log it
    if (earlyRelease && !holdElapsed) {
      logStep("Early release requested by poster - bypassing hold period");
    } else {
      logStep("Hold period elapsed or overridden");
    }

    // Get hunter's Stripe Connect account
    const { data: hunterProfile, error: hunterError } = await supabaseClient
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_payouts_enabled, username')
      .eq('id', submission.hunter_id)
      .single();

    if (hunterError || !hunterProfile) {
      throw new Error('Hunter profile not found');
    }

    if (!hunterProfile.stripe_connect_account_id) {
      throw new Error('Hunter has not set up Stripe Connect for payouts');
    }

    if (!hunterProfile.stripe_connect_payouts_enabled) {
      throw new Error('Hunter Stripe Connect account is not enabled for payouts');
    }
    logStep("Hunter Stripe Connect verified", { 
      connectAccountId: hunterProfile.stripe_connect_account_id 
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Calculate payout amount (after platform fee AND transfer fee)
    const bountyAmount = escrow.amount;
    const platformFee = 2 + (bountyAmount * 0.05); // $2 + 5% platform fee
    const afterPlatformFee = bountyAmount - platformFee;
    
    // Stripe Connect transfer fee: 0.25% + $0.25
    const transferFee = Math.round((afterPlatformFee * 0.0025 + 0.25) * 100) / 100;
    const hunterPayout = Math.round((afterPlatformFee - transferFee) * 100) / 100;
    
    logStep("Payout calculated", { 
      bountyAmount, 
      platformFee: platformFee.toFixed(2),
      transferFee: transferFee.toFixed(2),
      hunterPayout: hunterPayout.toFixed(2) 
    });

    // Create transfer to hunter's Connect account
    const transfer = await stripe.transfers.create({
      amount: Math.round(hunterPayout * 100), // Convert to cents
      currency: escrow.currency || 'usd',
      destination: hunterProfile.stripe_connect_account_id,
      description: `BountyBay payout for: ${bounty.title}`,
      metadata: {
        bounty_id: submission.bounty_id,
        submission_id: submissionId,
        hunter_id: submission.hunter_id,
        poster_id: bounty.poster_id,
        platform_fee: platformFee.toFixed(2),
        transfer_fee: transferFee.toFixed(2),
        original_amount: bountyAmount.toString(),
      },
    });
    logStep("Stripe transfer created", { transferId: transfer.id });

    // Update escrow transaction
    const { error: updateError } = await supabaseClient
      .from('escrow_transactions')
      .update({
        payout_method: 'stripe',
        manual_payout_status: 'sent',
        manual_payout_sent_at: new Date().toISOString(),
        payout_sent_amount: hunterPayout,
        platform_fee_amount: platformFee,
        manual_payout_reference: transfer.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', escrow.id);

    if (updateError) {
      logStep("WARNING: Failed to update escrow record", { error: updateError });
      // Don't fail - transfer is already done
    }

    // Create notification for hunter
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: submission.hunter_id,
        type: 'payout_sent',
        title: 'Payment Released! 💰',
        message: `$${hunterPayout.toFixed(2)} has been transferred to your Stripe account for "${bounty.title}" (after $${platformFee.toFixed(2)} platform fee + $${transferFee.toFixed(2)} transfer fee)`,
        bounty_id: submission.bounty_id,
        submission_id: submissionId,
      });
    logStep("Hunter notification created");

    return new Response(JSON.stringify({
      success: true,
      transfer_id: transfer.id,
      amount: hunterPayout,
      platform_fee: platformFee,
      hunter_name: hunterProfile.username || 'Hunter',
      message: `$${hunterPayout.toFixed(2)} transferred to hunter's Stripe account`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in release-funds", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
