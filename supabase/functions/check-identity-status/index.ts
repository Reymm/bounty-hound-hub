import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CHECK-IDENTITY-STATUS] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Checking identity status");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid authorization token");
    }

    logStep("User authenticated", { userId: user.id });

    // Get profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("identity_verified, identity_session_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      throw new Error("Could not fetch profile");
    }

    // If already verified, return immediately
    if (profile.identity_verified) {
      logStep("Already verified");
      return new Response(
        JSON.stringify({ 
          verified: true,
          status: "verified"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no session, not started
    if (!profile.identity_session_id) {
      logStep("No session found");
      return new Response(
        JSON.stringify({ 
          verified: false,
          status: "not_started"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check session status on Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const session = await stripe.identity.verificationSessions.retrieve(
      profile.identity_session_id
    );

    logStep("Retrieved session from Stripe", { 
      sessionId: session.id, 
      status: session.status 
    });

    // Map Stripe status to our status
    let status: string;
    let verified = false;

    switch (session.status) {
      case "verified":
        status = "verified";
        verified = true;
        // Update profile
        await supabaseClient
          .from("profiles")
          .update({ identity_verified: true })
          .eq("id", user.id);
        logStep("Updated profile to verified");
        break;
      case "requires_input":
        status = "pending";
        break;
      case "processing":
        status = "processing";
        break;
      case "canceled":
        status = "canceled";
        break;
      default:
        status = session.status;
    }

    return new Response(
      JSON.stringify({ 
        verified,
        status,
        session_id: session.id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    logStep("Error checking identity status", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
