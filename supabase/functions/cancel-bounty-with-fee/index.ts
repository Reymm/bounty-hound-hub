import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-BOUNTY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { bountyId } = await req.json();
    if (!bountyId) throw new Error("bountyId is required");

    // Get bounty details and verify ownership
    const { data: bounty, error: bountyError } = await supabaseClient
      .from('Bounties')
      .select('*, created_at, amount, status, poster_id')
      .eq('id', bountyId)
      .single();

    if (bountyError || !bounty) {
      throw new Error("Bounty not found");
    }

    if (bounty.poster_id !== user.id) {
      throw new Error("Only the bounty poster can cancel");
    }

    if (bounty.status === 'cancelled' || bounty.status === 'completed' || bounty.status === 'fulfilled') {
      throw new Error("Bounty cannot be cancelled in current status");
    }

    // Check if there are accepted submissions (non-refundable)
    const { data: acceptedSubmissions } = await supabaseClient
      .from('Submissions')
      .select('id, status')
      .eq('bounty_id', bountyId)
      .eq('status', 'accepted');

    if (acceptedSubmissions && acceptedSubmissions.length > 0) {
      throw new Error("Cannot cancel bounty with accepted submissions. Escrow is non-refundable after hunter acceptance.");
    }

    // Get escrow transaction first (need total_charged_amount)
    const { data: escrowData, error: escrowError } = await supabaseClient
      .from('escrow_transactions')
      .select('*')
      .eq('bounty_id', bountyId)
      .single();

    if (escrowError || !escrowData) {
      throw new Error("Escrow transaction not found");
    }

    // Calculate cancellation fee (2% of bounty amount only, not the total charged)
    const { data: feeData, error: feeError } = await supabaseClient
      .rpc('calculate_cancellation_fee', { 
        bounty_id_param: bountyId 
      });

    if (feeError) throw new Error(`Failed to calculate fee: ${feeError.message}`);
    
    const cancellationFee = feeData || 0;
    // Refund the total amount they paid (including platform and Stripe fees) minus only the cancellation fee
    const refundAmount = escrowData.total_charged_amount - cancellationFee;
    
    logStep("Cancellation fee calculated", { 
      bountyAmount: bounty.amount,
      totalCharged: escrowData.total_charged_amount,
      cancellationFee, 
      refundAmount 
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Cancel the payment intent or issue refund
    if (escrowData.status === 'requires_capture') {
      // Cancel uncaptured payment
      await stripe.paymentIntents.cancel(escrowData.stripe_payment_intent_id);
      logStep("Payment intent cancelled", { paymentIntentId: escrowData.stripe_payment_intent_id });
      
      // Update escrow transaction
      await supabaseClient
        .from('escrow_transactions')
        .update({
          status: 'cancelled',
          cancellation_fee_amount: cancellationFee,
          refund_amount: refundAmount,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowData.id);
        
    } else if (escrowData.status === 'succeeded') {
      // Issue refund minus cancellation fee
      const refundAmountCents = Math.round(refundAmount * 100);
      
      if (refundAmountCents > 0) {
        await stripe.refunds.create({
          payment_intent: escrowData.stripe_payment_intent_id,
          amount: refundAmountCents,
          reason: 'requested_by_customer',
          metadata: {
            bounty_id: bountyId,
            cancellation_fee: cancellationFee.toString()
          }
        });
        logStep("Refund issued", { refundAmount, cancellationFee });
      }
      
      // Update escrow transaction
      await supabaseClient
        .from('escrow_transactions')
        .update({
          status: 'refunded',
          cancellation_fee_amount: cancellationFee,
          refund_amount: refundAmount,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowData.id);
    } else {
      throw new Error(`Cannot cancel escrow in status: ${escrowData.status}`);
    }

    // Update bounty status
    await supabaseClient
      .from('Bounties')
      .update({ 
        status: 'cancelled',
        escrow_status: 'cancelled'
      })
      .eq('id', bountyId);

    logStep("Bounty cancelled successfully");

    return new Response(JSON.stringify({
      success: true,
      cancellationFee,
      refundAmount,
      message: cancellationFee > 0 
        ? `Bounty cancelled. $${refundAmount.toFixed(2)} refunded. $${cancellationFee.toFixed(2)} cancellation fee applied (bounty posted >24 hours ago).`
        : `Bounty cancelled. Full refund of $${refundAmount.toFixed(2)} issued.`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in cancel-bounty-with-fee", { message: errorMessage });
    // Return generic error to client, keep details in server logs
    const isAuthError = errorMessage.includes('Authentication') || errorMessage.includes('authorization') || errorMessage.includes('poster');
    const isNotFound = errorMessage.includes('not found');
    return new Response(JSON.stringify({ 
      error: isAuthError ? 'Authorization failed' : isNotFound ? 'Bounty not found' : 'Cancellation failed',
      code: isAuthError ? 'AUTH_ERROR' : isNotFound ? 'NOT_FOUND' : 'CANCEL_ERROR'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isAuthError ? 403 : isNotFound ? 404 : 500,
    });
  }
});
