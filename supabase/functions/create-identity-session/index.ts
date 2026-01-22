import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CREATE-IDENTITY-SESSION] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting identity session creation");

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

    // Check if user already has an active or completed session
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("identity_verified, identity_session_id")
      .eq("id", user.id)
      .single();

    if (profile?.identity_verified) {
      logStep("User already verified");
      return new Response(
        JSON.stringify({ 
          already_verified: true,
          message: "Identity already verified" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Check if there's an existing session that's still usable
    if (profile?.identity_session_id) {
      try {
        const existingSession = await stripe.identity.verificationSessions.retrieve(
          profile.identity_session_id
        );
        
        if (existingSession.status === "requires_input") {
          logStep("Returning existing session URL", { sessionId: existingSession.id });
          return new Response(
            JSON.stringify({ 
              url: existingSession.url,
              session_id: existingSession.id 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else if (existingSession.status === "verified") {
          // Update profile and return
          await supabaseClient
            .from("profiles")
            .update({ identity_verified: true })
            .eq("id", user.id);
          
          return new Response(
            JSON.stringify({ 
              already_verified: true,
              message: "Identity already verified" 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // If canceled or expired, create a new one
      } catch (e) {
        logStep("Existing session not found or invalid, creating new");
      }
    }

    // Create new verification session
    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: {
        user_id: user.id,
        user_email: user.email || "",
      },
      options: {
        document: {
          allowed_types: ["driving_license", "passport", "id_card"],
          require_id_number: false,
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
      return_url: `https://bountybay.lovable.app/identity-complete`,
    });

    logStep("Created verification session", { sessionId: session.id });

    // Store session ID in profile
    await supabaseClient
      .from("profiles")
      .update({ identity_session_id: session.id })
      .eq("id", user.id);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        session_id: session.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    logStep("Error creating identity session", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
