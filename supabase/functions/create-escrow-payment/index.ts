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
    .min(10, 'Amount must be at least $10')
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
    logStep("Function started - CARD SAVE ONLY MODEL (no auth holds)");

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
    
    // Check for promo code - if valid, skip payment setup entirely
    if (rawBody.promo_code) {
      const promoCode = String(rawBody.promo_code).toUpperCase().trim();
      logStep("Promo code provided, checking validity", { code: promoCode });
      
      const { data: promoData, error: promoError } = await supabaseClient
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode)
        .eq('is_active', true)
        .single();
      
      if (promoError || !promoData) {
        return new Response(JSON.stringify({ error: 'Invalid promo code' }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      if (promoData.times_used >= promoData.max_uses) {
        return new Response(JSON.stringify({ error: 'This promo code has been fully used' }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      if (promoData.expires_at && new Date(promoData.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'This promo code has expired' }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      logStep("Promo code valid, skipping payment setup", { 
        code: promoCode, 
        maxAmount: promoData.max_amount,
        remainingUses: promoData.max_uses - promoData.times_used
      });
      
      return new Response(JSON.stringify({
        promo_sponsored: true,
        promo_code: promoCode,
        bounty_amount: promoData.max_amount,
        stripe_fee: 0,
        total_charge: 0,
        hunter_fee: 0,
        payment_mode: 'sponsored',
        status: 'promo_sponsored'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
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
    
    // Hunter fee: $2 + 5% taken from hunter on payout (not charged to poster)
    const hunterFeeFlat = 2; // $2 flat fee
    const hunterFeePercent = 0.05; // 5%
    const hunterFee = Math.round((hunterFeeFlat + amount * hunterFeePercent) * 100) / 100;
    
    // Stripe processing fee: 3.7% + $0.30 (2.9% base + 0.8% international card fee)
    // Formula: total = (amount + fixed) / (1 - rate) to net exactly 'amount' after Stripe takes their cut
    const STRIPE_FEE_RATE = 0.037; // 3.7% covers base + international card fees
    const STRIPE_FIXED_FEE = 0.30;
    const totalCharge = Math.round(((amount + STRIPE_FIXED_FEE) / (1 - STRIPE_FEE_RATE)) * 100) / 100;
    const stripeFee = Math.round((totalCharge - amount) * 100) / 100;
    
    logStep("Amount calculated (card-save model)", {
      bountyAmount: amount, 
      stripeFee: stripeFee,
      totalCharge: totalCharge,
      hunterFee: hunterFee,
      currency,
      paymentMode: 'deferred' // Always deferred now - no auth holds
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

    // ALWAYS use SetupIntent - card is saved and charged only when claim is accepted
    // This avoids 7-day authorization hold expiration issues for long-term bounties
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session', // Allow charging later without customer present
      payment_method_options: {
        card: {
          // Require CVC check to pass - Stripe will decline if CVC fails
          mandate_options: undefined
        }
      },
      metadata: {
        supabase_user_id: user.id,
        type: 'bounty_escrow',
        bounty_amount: amount.toString(),
        platform_fee: hunterFee.toString()
      }
    });
    logStep("Created SetupIntent (card-save only)", { setupIntentId: setupIntent.id, status: setupIntent.status });

    // Store escrow transaction in database with card_pending status
    const { data: escrowData, error: escrowError } = await supabaseClient
      .from('escrow_transactions')
      .insert({
        poster_id: user.id,
        stripe_setup_intent_id: setupIntent.id,
        stripe_payment_intent_id: `setup_${setupIntent.id}`, // Unique placeholder until we charge
        amount: amount,
        total_charge_amount: totalCharge,
        stripe_fee_amount: stripeFee,
        platform_fee_amount: hunterFee,
        currency: currency.toLowerCase(),
        status: 'card_pending'
      })
      .select()
      .single();

    if (escrowError) {
      logStep("Database error", { error: escrowError });
      throw new Error('Failed to create escrow record');
    }
    logStep("Created escrow record", { escrowId: escrowData.id });

    return new Response(JSON.stringify({
      setup_intent_id: setupIntent.id,
      client_secret: setupIntent.client_secret,
      escrow_id: escrowData.id,
      bounty_amount: amount,
      stripe_fee: stripeFee,
      total_charge: totalCharge,
      hunter_fee: hunterFee,
      payment_mode: 'deferred', // Always deferred now
      status: 'card_pending'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-escrow-payment", { message: errorMessage });
    // Return generic error to client, keep details in server logs
    const isAuthError = errorMessage.includes('Authentication') || errorMessage.includes('authorization');
    return new Response(JSON.stringify({ 
      error: isAuthError ? 'Authentication failed' : 'Payment setup failed',
      code: isAuthError ? 'AUTH_ERROR' : 'PAYMENT_ERROR'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isAuthError ? 401 : 500,
    });
  }
});
