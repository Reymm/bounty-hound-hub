import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONFIRM-ESCROW] ${step}${detailsStr}`);
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
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { payment_intent_id, bounty_data } = await req.json();
    if (!payment_intent_id || !bounty_data) {
      throw new Error("Payment intent ID and bounty data are required");
    }
    logStep("Request data validated", { 
      payment_intent_id, 
      bountyTitle: bounty_data.title,
      tags: bounty_data.tags,
      images: bounty_data.images,
      category: bounty_data.category
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Verify payment intent is succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (paymentIntent.status !== 'requires_capture') {
      throw new Error(`Payment not ready for capture. Status: ${paymentIntent.status}`);
    }
    logStep("Payment intent verified", { status: paymentIntent.status });

    // Get escrow transaction
    const { data: escrowData, error: escrowError } = await supabaseClient
      .from('escrow_transactions')
      .select('*')
      .eq('stripe_payment_intent_id', payment_intent_id)
      .eq('poster_id', user.id)
      .single();

    if (escrowError || !escrowData) {
      throw new Error("Escrow transaction not found");
    }
    logStep("Escrow transaction found", { escrowId: escrowData.id });

    // Create bounty with escrow information
    const { data: bountyData, error: bountyError } = await supabaseClient
      .from('Bounties')
      .insert({
        title: bounty_data.title,
        description: bounty_data.description,
        amount: escrowData.amount,
        poster_id: user.id,
        status: 'open',
        escrow_status: 'secured',
        escrow_amount: escrowData.amount,
        images: bounty_data.images || [],
        category: bounty_data.category,
        subcategory: bounty_data.subcategory,
        location: bounty_data.location,
        deadline: bounty_data.deadline,
        tags: bounty_data.tags || [],
        verification_requirements: bounty_data.verificationRequirements || [],
        target_price_min: bounty_data.targetPriceMin,
        target_price_max: bounty_data.targetPriceMax
      })
      .select()
      .single();

    if (bountyError) {
      logStep("Bounty creation error", { error: bountyError });
      throw new Error(`Failed to create bounty: ${bountyError.message}`);
    }
    logStep("Bounty created", { bountyId: bountyData.id });

    // Update escrow transaction with bounty ID
    const { error: updateError } = await supabaseClient
      .from('escrow_transactions')
      .update({
        bounty_id: bountyData.id,
        status: 'requires_capture'
      })
      .eq('id', escrowData.id);

    if (updateError) {
      logStep("Escrow update error", { error: updateError });
      throw new Error(`Failed to update escrow: ${updateError.message}`);
    }
    logStep("Escrow transaction updated");

    // Send notification email
    try {
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError || !userData.user) throw new Error('Failed to get user data for email');

      await supabaseClient.functions.invoke('send-notification-email', {
        body: {
          type: 'bounty_posted',
          recipientEmail: userData.user.email,
          recipientName: userData.user.email?.split('@')[0] || 'User',
          bountyTitle: bounty_data.title,
          bountyId: bountyData.id,
          amount: escrowData.amount,
        }
      });
    } catch (emailError) {
      logStep('Email notification failed', { error: emailError });
      // Don't fail the whole request if email fails
    }

    return new Response(JSON.stringify({
      bounty_id: bountyData.id,
      escrow_status: 'secured',
      message: 'Bounty created successfully with escrow secured'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in confirm-escrow-and-create-bounty", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});