import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CONNECT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Create Connect account function started");

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
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body to get country selection
    let selectedCountry: string | undefined;
    try {
      const body = await req.json();
      selectedCountry = body.country;
      logStep("Country from request", { country: selectedCountry });
    } catch {
      // No body or invalid JSON - country will be undefined
      logStep("No country specified in request body");
    }

    // Validate country if provided
    const supportedCountries = ['US', 'CA'];
    if (selectedCountry && !supportedCountries.includes(selectedCountry)) {
      throw new Error(`Unsupported country: ${selectedCountry}. Supported countries: ${supportedCountries.join(', ')}`);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if user already has a Connect account
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_onboarding_complete, full_name')
      .eq('id', user.id)
      .maybeSingle();

    let accountId = profile?.stripe_connect_account_id;

    // If user has an account ID in DB, verify it actually exists on Stripe
    if (accountId) {
      try {
        const existingAccount = await stripe.accounts.retrieve(accountId);
        logStep("Verified existing Stripe account", { accountId, chargesEnabled: existingAccount.charges_enabled });
        
        // If fully onboarded, create a LOGIN link (not onboarding link)
        if (profile?.stripe_connect_onboarding_complete) {
          logStep("User already has onboarded account, creating login link", { accountId });
          const loginLink = await stripe.accounts.createLoginLink(accountId);
          return new Response(JSON.stringify({
            account_id: accountId,
            onboarding_url: loginLink.url,
            status: 'existing'
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      } catch (stripeErr: any) {
        // Account doesn't exist on Stripe OR was created in test mode but we're using live key
        // Clear stale account and create new one
        if (stripeErr?.code === 'resource_missing' || stripeErr?.code === 'account_invalid') {
          logStep("Stripe account invalid or missing, clearing from DB", { accountId, errorCode: stripeErr?.code });
          await supabaseClient
            .from('profiles')
            .update({
              stripe_connect_account_id: null,
              stripe_connect_onboarding_complete: false,
              stripe_connect_charges_enabled: false,
              stripe_connect_payouts_enabled: false,
              stripe_connect_details_submitted: false,
            })
            .eq('id', user.id);
          accountId = null; // Force creation of new account
        } else {
          throw stripeErr; // Re-throw other errors
        }
      }
    }

    // Create new Connect account if one doesn't exist
    // If a country is specified, use it. Otherwise let Stripe determine based on IP.
    if (!accountId) {
      const accountParams: any = {
        type: 'express',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          product_description: 'Freelance finder services - locating items and leads for bounty posters on BountyBay marketplace',
          mcc: '7299', // Miscellaneous personal services
          url: 'https://bountybay.co', // Pre-fill so hunters don't need their own website
        },
        metadata: {
          supabase_user_id: user.id,
          user_email: user.email,
        },
      };

      // Set country if explicitly selected by user
      if (selectedCountry) {
        accountParams.country = selectedCountry;
        logStep("Creating account with explicit country", { country: selectedCountry });
      }

      const account = await stripe.accounts.create(accountParams);
      
      accountId = account.id;
      logStep("Created new Connect account", { accountId });

      // Store Connect account ID in database
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          stripe_connect_account_id: accountId,
        })
        .eq('id', user.id);

      if (updateError) {
        logStep("Database update error", { error: updateError });
        throw new Error('Failed to update profile');
      }
      logStep("Updated profile with Connect account ID");
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${req.headers.get("origin")}/me/profile`,
      return_url: `${req.headers.get("origin")}/connect-complete`,
      type: 'account_onboarding',
    });
    logStep("Created account onboarding link");

    return new Response(JSON.stringify({
      account_id: accountId,
      onboarding_url: accountLink.url,
      status: 'new'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-connect-account", { message: errorMessage, code: error?.code, type: error?.type });
    // Return generic error to client, keep details in server logs
    const isAuthError = errorMessage.includes('Authentication') || errorMessage.includes('authorization');
    const isCountryError = errorMessage.includes('country');
    return new Response(JSON.stringify({ 
      error: isAuthError ? 'Authentication failed' : isCountryError ? 'Invalid country selection' : 'Connect account setup failed',
      code: isAuthError ? 'AUTH_ERROR' : isCountryError ? 'INVALID_COUNTRY' : 'CONNECT_ERROR'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isAuthError ? 401 : isCountryError ? 400 : 500,
    });
  }
});
