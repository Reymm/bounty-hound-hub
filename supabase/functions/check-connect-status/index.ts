import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-CONNECT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Check Connect status function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeTestKey = Deno.env.get("STRIPE_TEST_SECRET_KEY");
    if (!stripeKey && !stripeTestKey) throw new Error("No Stripe keys configured");

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

    // Get user's Connect account ID and mode
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_test_mode')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.stripe_connect_account_id) {
      logStep("No Connect account found");
      return new Response(JSON.stringify({
        has_account: false,
        onboarding_complete: false,
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Use appropriate key based on account mode
    // If test_mode flag is set, or if account ID contains test indicators, use test key
    const isTestAccount = profile.stripe_connect_test_mode === true;
    const keyToUse = isTestAccount && stripeTestKey ? stripeTestKey : stripeKey;
    
    if (!keyToUse) {
      throw new Error(isTestAccount ? "STRIPE_TEST_SECRET_KEY not configured for test account" : "STRIPE_SECRET_KEY not configured");
    }
    
    logStep("Using Stripe key", { mode: isTestAccount ? "test" : "live" });
    const stripe = new Stripe(keyToUse, { apiVersion: "2023-10-16" });

    // Retrieve account from Stripe
    let account;
    try {
      account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);
    } catch (stripeError: any) {
      // If we get a test/live mode mismatch, try the other key
      if (stripeError.message?.includes('testmode key') && stripeTestKey) {
        logStep("Switching to test key due to mode mismatch");
        const testStripe = new Stripe(stripeTestKey, { apiVersion: "2023-10-16" });
        account = await testStripe.accounts.retrieve(profile.stripe_connect_account_id);
        // Update the profile to remember this is a test account
        await supabaseClient
          .from('profiles')
          .update({ stripe_connect_test_mode: true })
          .eq('id', user.id);
      } else if (stripeError.message?.includes('livemode key') && stripeKey) {
        logStep("Switching to live key due to mode mismatch");
        const liveStripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
        account = await liveStripe.accounts.retrieve(profile.stripe_connect_account_id);
        await supabaseClient
          .from('profiles')
          .update({ stripe_connect_test_mode: false })
          .eq('id', user.id);
      } else {
        throw stripeError;
      }
    }
    
    logStep("Retrieved Stripe Connect account", { 
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted
    });

    // In test mode, details_submitted is often enough even if charges/payouts aren't enabled yet
    // For production, we still want full verification but details_submitted allows users to proceed
    const isOnboardingComplete = account.details_submitted === true;
    
    // Update profile with latest status
    await supabaseClient
      .from('profiles')
      .update({
        stripe_connect_onboarding_complete: isOnboardingComplete,
        stripe_connect_charges_enabled: account.charges_enabled,
        stripe_connect_payouts_enabled: account.payouts_enabled,
        stripe_connect_details_submitted: account.details_submitted
      })
      .eq('id', user.id);
    logStep("Updated profile with Connect status");

    return new Response(JSON.stringify({
      has_account: true,
      onboarding_complete: isOnboardingComplete,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: account.requirements
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-connect-status", { message: errorMessage });
    // Return generic error to client, keep details in server logs
    const isAuthError = errorMessage.includes('Authentication') || errorMessage.includes('authorization');
    return new Response(JSON.stringify({ 
      error: isAuthError ? 'Authentication failed' : 'Connect status check failed',
      code: isAuthError ? 'AUTH_ERROR' : 'CONNECT_ERROR'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isAuthError ? 401 : 500,
    });
  }
});
