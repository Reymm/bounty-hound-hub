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

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if user already has a Connect account
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_onboarding_complete, full_name')
      .eq('id', user.id)
      .single();

    let accountId = profile?.stripe_connect_account_id;

    // If user already has a fully onboarded account, return it
    if (accountId && profile?.stripe_connect_onboarding_complete) {
      logStep("User already has onboarded account", { accountId });
      
      // Create a new account link for them to update details if needed
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${req.headers.get("origin")}/me/profile`,
        return_url: `${req.headers.get("origin")}/connect-complete`,
        type: 'account_onboarding',
      });

      return new Response(JSON.stringify({
        account_id: accountId,
        onboarding_url: accountLink.url,
        status: 'existing'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create new Connect account if one doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US', // You can make this dynamic based on user location
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          supabase_user_id: user.id,
          user_email: user.email,
        },
      });
      
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
        throw new Error(`Failed to update profile: ${updateError.message}`);
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

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-connect-account", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
