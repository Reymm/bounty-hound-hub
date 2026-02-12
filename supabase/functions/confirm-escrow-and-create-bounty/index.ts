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
    logStep("Function started - CARD SAVE ONLY MODEL");

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
    
    // Now we only support SetupIntent flow (card-save only, no auth holds)
    const { setup_intent_id, bounty_data } = requestBody;
    
    if (!setup_intent_id || !bounty_data) {
      throw new Error("SetupIntent ID and bounty data are required");
    }
    
    // SERVER-SIDE VALIDATION: Verify critical bounty requirements
    const verificationRequirements = bounty_data.verificationRequirements || [];
    const validRequirements = verificationRequirements.filter((req: string) => 
      typeof req === 'string' && req.trim().length > 0
    );
    
    if (validRequirements.length === 0) {
      logStep("VALIDATION FAILED: No valid verification requirements", { 
        received: verificationRequirements 
      });
      throw new Error("At least one verification requirement is required");
    }
    
    if (!bounty_data.title || bounty_data.title.trim().length < 10) {
      throw new Error("Bounty title must be at least 10 characters");
    }
    
    if (!bounty_data.description || bounty_data.description.trim().length < 20) {
      throw new Error("Bounty description must be at least 20 characters");
    }
    
    logStep("Server-side validation passed", { 
      validRequirementsCount: validRequirements.length 
    });
    
    logStep("Request data validated", { 
      setupIntentId: setup_intent_id,
      bountyTitle: bounty_data.title
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Verify SetupIntent succeeded and get payment method
    const setupIntent = await stripe.setupIntents.retrieve(setup_intent_id);
    if (setupIntent.status !== 'succeeded') {
      throw new Error(`Card not saved. Status: ${setupIntent.status}`);
    }
    const paymentMethodId = typeof setupIntent.payment_method === 'string' 
      ? setupIntent.payment_method 
      : setupIntent.payment_method?.id || null;
    
    if (!paymentMethodId) {
      throw new Error("No payment method found on SetupIntent");
    }
    logStep("SetupIntent verified", { status: setupIntent.status, paymentMethodId });

    // CVC is validated client-side by Stripe's SetupIntent flow
    // Server-side re-checking was causing false rejections with certain issuers
    logStep("Card verified via SetupIntent", { paymentMethodId });

    // Get escrow transaction
    const { data: escrowData, error: escrowError } = await supabaseClient
      .from('escrow_transactions')
      .select('*')
      .eq('stripe_setup_intent_id', setup_intent_id)
      .eq('poster_id', user.id)
      .single();

    if (escrowError || !escrowData) {
      throw new Error("Escrow transaction not found");
    }
    logStep("Escrow transaction found", { escrowId: escrowData.id });
    
    // Validate minimum bounty amount
    if (escrowData.amount < 10) {
      throw new Error("Minimum bounty is $10");
    }

    // Create bounty with escrow information
    const bountyInsertData = {
      title: bounty_data.title,
      description: bounty_data.description,
      amount: escrowData.amount,
      poster_id: user.id,
      status: 'open',
      escrow_status: 'card_saved', // Always card_saved now - no auth holds
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
      escrowStatus: 'card_saved'
    });

    // Update escrow transaction with bounty ID and payment method
    const { error: updateError } = await supabaseClient
      .from('escrow_transactions')
      .update({
        bounty_id: bountyData.id,
        status: 'card_saved',
        stripe_payment_method_id: paymentMethodId,
        card_saved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', escrowData.id);

    if (updateError) {
      logStep("Escrow update error", { error: updateError });
      throw new Error('Failed to update escrow');
    }
    logStep("Escrow transaction updated");

    return new Response(JSON.stringify({
      bounty_id: bountyData.id,
      escrow_status: 'card_saved',
      payment_mode: 'deferred',
      message: 'Bounty created successfully. Card saved — will be charged when you accept a submission.'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in confirm-escrow-and-create-bounty", { message: errorMessage });
    // Return specific error for CVC failures so UI can show proper message
    const isAuthError = errorMessage.includes('Authentication') || errorMessage.includes('authorization');
    const isNotFound = errorMessage.includes('not found');
    const isCvcError = errorMessage.includes('CVC') || errorMessage.includes('security code');
    return new Response(JSON.stringify({ 
      error: isCvcError ? errorMessage : isAuthError ? 'Authentication failed' : isNotFound ? 'Transaction not found' : 'Bounty creation failed',
      code: isCvcError ? 'CVC_ERROR' : isAuthError ? 'AUTH_ERROR' : isNotFound ? 'NOT_FOUND' : 'CREATE_ERROR'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isCvcError ? 400 : isAuthError ? 401 : isNotFound ? 404 : 500,
    });
  }
});
