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
    logStep("Function started - SAVE CARD MODEL");

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

    const requestBody = await req.json();
    logStep("Raw request received", { body: requestBody });
    
    // Support both old (payment_intent_id) and new (setup_intent_id) flows
    const { payment_intent_id, setup_intent_id, bounty_data } = requestBody;
    const intentId = setup_intent_id || payment_intent_id;
    
    if (!intentId || !bounty_data) {
      throw new Error("Intent ID and bounty data are required");
    }
    
    const isSetupIntent = !!setup_intent_id;
    logStep("Request data validated", { 
      intentId,
      isSetupIntent,
      bountyTitle: bounty_data.title
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    let paymentMethodId: string | null = null;

    if (isSetupIntent) {
      // SAVE CARD MODEL: Verify SetupIntent succeeded and get payment method
      const setupIntent = await stripe.setupIntents.retrieve(intentId);
      if (setupIntent.status !== 'succeeded') {
        throw new Error(`Card not saved. Status: ${setupIntent.status}`);
      }
      paymentMethodId = typeof setupIntent.payment_method === 'string' 
        ? setupIntent.payment_method 
        : setupIntent.payment_method?.id || null;
      
      if (!paymentMethodId) {
        throw new Error("No payment method found on SetupIntent");
      }
      logStep("SetupIntent verified", { status: setupIntent.status, paymentMethodId });
    } else {
      // LEGACY: Old PaymentIntent flow (backward compatibility)
      const paymentIntent = await stripe.paymentIntents.retrieve(intentId);
      if (paymentIntent.status !== 'requires_capture') {
        throw new Error(`Payment not ready for capture. Status: ${paymentIntent.status}`);
      }
      logStep("PaymentIntent verified (legacy)", { status: paymentIntent.status });
    }

    // Get escrow transaction
    const escrowQuery = isSetupIntent 
      ? supabaseClient.from('escrow_transactions').select('*').eq('stripe_setup_intent_id', intentId).eq('poster_id', user.id).single()
      : supabaseClient.from('escrow_transactions').select('*').eq('stripe_payment_intent_id', intentId).eq('poster_id', user.id).single();
    
    const { data: escrowData, error: escrowError } = await escrowQuery;

    if (escrowError || !escrowData) {
      throw new Error("Escrow transaction not found");
    }
    logStep("Escrow transaction found", { escrowId: escrowData.id });

    // Create bounty with escrow information
    const bountyInsertData = {
      title: bounty_data.title,
      description: bounty_data.description,
      amount: escrowData.amount,
      poster_id: user.id,
      status: 'open',
      escrow_status: isSetupIntent ? 'card_saved' : 'secured', // Different status for save-card model
      escrow_amount: escrowData.amount,
      images: bounty_data.images || [],
      category: bounty_data.category,
      subcategory: bounty_data.subcategory,
      location: bounty_data.location,
      deadline: bounty_data.deadline,
      tags: bounty_data.tags || [],
      verification_requirements: bounty_data.verificationRequirements || [],
      target_price_min: bounty_data.targetPriceMin,
      target_price_max: bounty_data.targetPriceMax,
      requires_shipping: bounty_data.requires_shipping || false,
      hunter_purchases_item: bounty_data.hunter_purchases_item || false,
      has_milestones: bounty_data.has_milestones || false,
      milestone_data: bounty_data.milestone_data || null
    };
    
    logStep("About to insert bounty", { insertData: bountyInsertData });
    
    const { data: bountyData, error: bountyError } = await supabaseClient
      .from('Bounties')
      .insert(bountyInsertData)
      .select()
      .single();

    if (bountyError) {
      logStep("Bounty creation error", { error: bountyError });
      throw new Error('Failed to create bounty');
    }
    logStep("Bounty created successfully", { 
      bountyId: bountyData.id,
      escrowStatus: bountyInsertData.escrow_status
    });

    // Update escrow transaction with bounty ID and payment method
    const escrowUpdate: Record<string, any> = {
      bounty_id: bountyData.id,
      status: isSetupIntent ? 'card_saved' : 'requires_capture',
      card_saved_at: isSetupIntent ? new Date().toISOString() : null
    };
    
    if (paymentMethodId) {
      escrowUpdate.stripe_payment_method_id = paymentMethodId;
    }

    const { error: updateError } = await supabaseClient
      .from('escrow_transactions')
      .update(escrowUpdate)
      .eq('id', escrowData.id);

    if (updateError) {
      logStep("Escrow update error", { error: updateError });
      throw new Error('Failed to update escrow');
    }
    logStep("Escrow transaction updated");

    return new Response(JSON.stringify({
      bounty_id: bountyData.id,
      escrow_status: isSetupIntent ? 'card_saved' : 'secured',
      message: isSetupIntent 
        ? 'Bounty created successfully. Card saved - will be charged when you accept a submission.'
        : 'Bounty created successfully with escrow secured'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in confirm-escrow-and-create-bounty", { message: errorMessage });
    // Return generic error to client, keep details in server logs
    const isAuthError = errorMessage.includes('Authentication') || errorMessage.includes('authorization');
    const isNotFound = errorMessage.includes('not found');
    return new Response(JSON.stringify({ 
      error: isAuthError ? 'Authentication failed' : isNotFound ? 'Transaction not found' : 'Bounty creation failed',
      code: isAuthError ? 'AUTH_ERROR' : isNotFound ? 'NOT_FOUND' : 'CREATE_ERROR'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isAuthError ? 401 : isNotFound ? 404 : 500,
    });
  }
});
