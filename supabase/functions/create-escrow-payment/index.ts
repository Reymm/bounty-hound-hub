import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-ESCROW] ${step}${detailsStr}`);
};

// Input validation schema
const escrowPaymentSchema = z.object({
  amount: z.number()
    .min(5, 'Amount must be at least $5')
    .max(10000, 'Amount cannot exceed $10,000')
    .positive('Amount must be positive'),
  currency: z.string()
    .length(3, 'Currency must be 3-letter code')
    .regex(/^[a-z]{3}$/, 'Currency must be lowercase ISO code')
    .default('usd')
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Use service role for database operations
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
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse and validate input
    const rawBody = await req.json();
    const validation = escrowPaymentSchema.safeParse(rawBody);
    
    if (!validation.success) {
      logStep("Validation failed", { errors: validation.error.issues });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: validation.error.issues.map(i => i.message)
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { amount, currency } = validation.data;
    
    // NO platform fee for poster - hunter pays 7% fee on payout
    // Only charge Stripe processing fee: 2.9% + $0.30, added ON TOP of bounty
    // If user enters $50 bounty, hunter gets $50, user pays $50 + fees
    const stripeFee = Math.round((amount * 0.029 + 0.30) * 100) / 100;
    const totalChargeAmount = Math.round((amount + stripeFee) * 100) / 100;
    
    logStep("Amount and fees calculated", { 
      bountyAmount: amount, 
      platformFee: 0, // No poster fee
      stripeFee,
      totalCharge: totalChargeAmount, 
      currency 
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists, create if not
    let customer;
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length > 0) {
      customer = customers.data[0];
      logStep("Found existing customer", { customerId: customer.id });
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }
      });
      logStep("Created new customer", { customerId: customer.id });
    }

    // Create payment intent for escrow (capture_method: manual for later capture)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalChargeAmount * 100), // Convert total charge to cents
      currency: currency.toLowerCase(),
      customer: customer.id,
      capture_method: 'manual', // We'll capture later when bounty is completed
      description: `Escrow deposit for bounty ($${amount})`,
      metadata: {
        supabase_user_id: user.id,
        type: 'escrow_deposit',
        bounty_amount: amount.toString(),
        platform_fee: '0' // No poster fee
      }
    });
    logStep("Created payment intent", { paymentIntentId: paymentIntent.id, status: paymentIntent.status });

    // Store escrow transaction in database
    const { data: escrowData, error: escrowError } = await supabaseClient
      .from('escrow_transactions')
      .insert({
        poster_id: user.id,
        stripe_payment_intent_id: paymentIntent.id,
        amount: amount, // Bounty amount (full amount goes to escrow)
        platform_fee_amount: 0, // No poster fee
        total_charged_amount: totalChargeAmount, // Total charged (bounty + Stripe fee)
        currency: currency.toLowerCase(),
        status: paymentIntent.status
      })
      .select()
      .single();

    if (escrowError) {
      logStep("Database error", { error: escrowError });
      throw new Error(`Failed to create escrow record: ${escrowError.message}`);
    }
    logStep("Created escrow record", { escrowId: escrowData.id });

    return new Response(JSON.stringify({
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      escrow_id: escrowData.id,
      bounty_amount: amount,
      platform_fee: 0, // No poster fee
      stripe_fee: stripeFee,
      total_charge: totalChargeAmount,
      status: paymentIntent.status
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-escrow-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});