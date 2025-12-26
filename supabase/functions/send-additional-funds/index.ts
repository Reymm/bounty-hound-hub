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
  console.log(`[SEND-ADDITIONAL-FUNDS] ${step}${detailsStr}`);
};

// Input validation schema
const sendFundsSchema = z.object({
  hunterId: z.string().uuid('Invalid hunter ID'),
  bountyId: z.string().uuid('Invalid bounty ID'),
  amount: z.number()
    .min(1, 'Amount must be at least $1')
    .max(10000, 'Amount cannot exceed $10,000')
    .positive('Amount must be positive'),
  note: z.string().max(500, 'Note too long').optional(),
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
    if (!user?.email) throw new Error("User not authenticated");
    logStep("Poster authenticated", { userId: user.id, email: user.email });

    // Parse and validate input
    const rawBody = await req.json();
    const validation = sendFundsSchema.safeParse(rawBody);
    
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

    const { hunterId, bountyId, amount, note } = validation.data;
    logStep("Input validated", { hunterId, bountyId, amount });

    // Verify the poster owns this bounty
    const { data: bountyData, error: bountyError } = await supabaseClient
      .from('Bounties')
      .select('id, poster_id, title')
      .eq('id', bountyId)
      .single();

    if (bountyError || !bountyData) {
      throw new Error('Bounty not found');
    }

    if (bountyData.poster_id !== user.id) {
      throw new Error('You are not the poster of this bounty');
    }
    logStep("Bounty ownership verified", { bountyTitle: bountyData.title });

    // Check if hunter has Stripe Connect set up
    const { data: hunterProfile, error: hunterError } = await supabaseClient
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_payouts_enabled, username, payout_country, payout_email')
      .eq('id', hunterId)
      .single();

    if (hunterError || !hunterProfile) {
      throw new Error('Hunter profile not found');
    }

    logStep("Hunter profile found", { 
      hasStripeConnect: !!hunterProfile.stripe_connect_account_id,
      payoutsEnabled: hunterProfile.stripe_connect_payouts_enabled,
      country: hunterProfile.payout_country
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get or create Stripe customer for the poster
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

    // Calculate fees - Stripe processing fee: 2.9% + $0.30
    const stripeFee = Math.round(((amount + 0.30) / (1 - 0.029) - amount) * 100) / 100;
    const totalCharge = Math.round((amount + stripeFee) * 100) / 100;
    
    logStep("Fees calculated", { amount, stripeFee, totalCharge });

    // Determine if this will be a direct transfer or manual payout
    const isManualPayout = hunterProfile.payout_country === 'US' || !hunterProfile.stripe_connect_account_id;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalCharge * 100), // Convert to cents
      currency: 'usd',
      customer: customer.id,
      description: `Additional funds for bounty: ${bountyData.title}${note ? ` - ${note}` : ''}`,
      metadata: {
        type: 'additional_funds',
        bounty_id: bountyId,
        hunter_id: hunterId,
        poster_id: user.id,
        note: note || '',
        is_manual_payout: isManualPayout.toString(),
        hunter_amount: amount.toString(),
      },
      // If hunter has Connect and not US, we can do automatic transfer
      ...(hunterProfile.stripe_connect_account_id && !isManualPayout ? {
        transfer_data: {
          destination: hunterProfile.stripe_connect_account_id,
          amount: Math.round(amount * 100), // Transfer the full amount to hunter
        },
      } : {}),
    });

    logStep("Payment intent created", { 
      paymentIntentId: paymentIntent.id, 
      status: paymentIntent.status,
      isManualPayout 
    });

    return new Response(JSON.stringify({
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      amount: amount,
      stripe_fee: stripeFee,
      total_charge: totalCharge,
      is_manual_payout: isManualPayout,
      hunter_name: hunterProfile.username || 'Hunter',
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send-additional-funds", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
