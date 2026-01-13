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

    // Get the escrow transaction for this bounty to retrieve saved payment method and currency
    const { data: escrow, error: escrowError } = await supabaseClient
      .from('escrow_transactions')
      .select('stripe_payment_method_id, stripe_payment_intent_id, currency')
      .eq('bounty_id', bountyId)
      .single();

    if (escrowError || !escrow?.stripe_payment_method_id) {
      throw new Error('No saved payment method found for this bounty');
    }
    
    // Use the same currency as the original bounty payment
    const paymentCurrency = escrow.currency || 'usd';
    logStep("Found saved payment method", { 
      paymentMethodId: escrow.stripe_payment_method_id,
      currency: paymentCurrency 
    });

    // Check if hunter has Stripe Connect set up
    const { data: hunterProfile, error: hunterError } = await supabaseClient
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_payouts_enabled, username')
      .eq('id', hunterId)
      .single();

    if (hunterError || !hunterProfile) {
      throw new Error('Hunter profile not found');
    }

    if (!hunterProfile.stripe_connect_account_id) {
      throw new Error('Hunter has not set up Stripe Connect for payouts');
    }

    logStep("Hunter profile found", { 
      hasStripeConnect: !!hunterProfile.stripe_connect_account_id,
      payoutsEnabled: hunterProfile.stripe_connect_payouts_enabled
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

    // Calculate fees properly for destination charges:
    // With destination charges, the transfer_data.amount is what gets sent to the connected account
    // Stripe takes processing fees from the TOTAL charge, not the transfer
    // So we need: totalCharge - processingFees >= transferAmount
    
    // We want hunter to receive EXACTLY 'amount'
    // transfer_data.amount = amount (hunter receives this directly)
    // Total charge needs to cover: transfer + all Stripe fees
    
    const STRIPE_PROCESSING_RATE = 0.029; // 2.9%
    const STRIPE_PROCESSING_FIXED = 30; // $0.30 in cents
    const STRIPE_CONNECT_RATE = 0.005; // 0.5% cross-border fee on transfer
    const STRIPE_CONNECT_FIXED = 25; // $0.25 in cents
    
    // Amount to transfer (what hunter will receive) - in cents
    const transferAmountCents = Math.round(amount * 100);
    
    // Connect fee Stripe will take from the platform (based on transfer amount)
    const connectFeeCents = Math.ceil(transferAmountCents * STRIPE_CONNECT_RATE) + STRIPE_CONNECT_FIXED;
    
    // Now calculate total charge: we need to cover transfer + connect fees, THEN account for processing fees
    // Let X = total charge in cents
    // Processing fee = X * 0.029 + 30
    // Net after processing = X - (X * 0.029 + 30) = X * 0.971 - 30
    // We need: X * 0.971 - 30 >= transferAmountCents + connectFeeCents (to cover transfer AND connect fees)
    // X * 0.971 >= transferAmountCents + connectFeeCents + 30
    // X >= (transferAmountCents + connectFeeCents + 30) / 0.971
    
    const minAmountNeeded = transferAmountCents + connectFeeCents + STRIPE_PROCESSING_FIXED;
    const totalChargeCents = Math.ceil(minAmountNeeded / (1 - STRIPE_PROCESSING_RATE));
    
    const totalCharge = totalChargeCents / 100;
    const totalFees = Math.round((totalChargeCents - transferAmountCents)) / 100;
    
    logStep("Fees calculated", { 
      hunterReceives: amount, 
      transferAmountCents, 
      connectFeeCents,
      totalChargeCents,
      totalCharge,
      totalFees 
    });

    // Create payment intent using the SAVED payment method with automatic transfer
    // Use the same currency as the original bounty payment to avoid conversion issues
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalChargeCents, // Total poster pays in cents
      currency: paymentCurrency, // Use the original bounty's currency
      customer: customer.id,
      payment_method: escrow.stripe_payment_method_id, // Use saved payment method
      off_session: true, // Charge without customer present
      confirm: true, // Immediately confirm the payment
      description: `Additional funds for bounty: ${bountyData.title}${note ? ` - ${note}` : ''}`,
      metadata: {
        type: 'additional_funds',
        bounty_id: bountyId,
        hunter_id: hunterId,
        poster_id: user.id,
        note: note || '',
        hunter_amount: amount.toString(),
        currency: paymentCurrency,
      },
      transfer_data: {
        destination: hunterProfile.stripe_connect_account_id,
        amount: transferAmountCents, // EXACTLY what hunter receives - in cents
      },
    });

    logStep("Payment intent created and confirmed", { 
      paymentIntentId: paymentIntent.id, 
      status: paymentIntent.status
    });

    // Check if payment succeeded
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment failed');
    }

    // Create notification for hunter
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: hunterId,
        type: 'additional_funds_received',
        title: 'Additional Payment Received! 💰',
        message: `You received an additional $${amount.toFixed(2)} for "${bountyData.title}"${note ? ` - ${note}` : ''}`,
        bounty_id: bountyId,
      });
    logStep("Hunter notification created");

    return new Response(JSON.stringify({
      success: true,
      payment_intent_id: paymentIntent.id,
      amount: amount, // What hunter receives
      total_fees: totalFees,
      total_charge: totalCharge,
      hunter_name: hunterProfile.username || 'Hunter',
      message: `$${amount.toFixed(2)} sent to ${hunterProfile.username || 'hunter'}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send-additional-funds", { message: errorMessage });
    // Return generic error to client, keep details in server logs
    const isAuthError = errorMessage.includes('Authentication') || errorMessage.includes('authorization') || errorMessage.includes('poster');
    const isNotFound = errorMessage.includes('not found');
    return new Response(JSON.stringify({ 
      error: isAuthError ? 'Authorization failed' : isNotFound ? 'Resource not found' : 'Payment failed',
      code: isAuthError ? 'AUTH_ERROR' : isNotFound ? 'NOT_FOUND' : 'PAYMENT_ERROR'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isAuthError ? 403 : isNotFound ? 404 : 500,
    });
  }
});
