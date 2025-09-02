import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-KYC] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("KYC verification function started");

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

    // Check if user already has a verification session
    const { data: existingKyc } = await supabaseClient
      .from('kyc_verifications')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingKyc?.status === 'verified') {
      logStep("User already verified");
      return new Response(JSON.stringify({
        status: 'already_verified',
        message: 'User is already verified'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create Stripe Identity verification session
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        supabase_user_id: user.id,
        user_email: user.email
      },
      return_url: `${req.headers.get("origin")}/kyc-complete`
    });
    logStep("Created Stripe verification session", { sessionId: verificationSession.id });

    // Store verification session in database
    const { data: kycData, error: kycError } = await supabaseClient
      .from('kyc_verifications')
      .upsert({
        user_id: user.id,
        stripe_verification_session_id: verificationSession.id,
        status: 'pending'
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (kycError) {
      logStep("Database error", { error: kycError });
      throw new Error(`Failed to create KYC record: ${kycError.message}`);
    }
    logStep("Created KYC record", { kycId: kycData.id });

    return new Response(JSON.stringify({
      verification_session_id: verificationSession.id,
      verification_url: verificationSession.url,
      status: 'pending'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-kyc-verification", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});