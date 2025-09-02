import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-KYC] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Check KYC status function started");

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
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get user's KYC record
    const { data: kycData, error: kycError } = await supabaseClient
      .from('kyc_verifications')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (kycError || !kycData) {
      logStep("No KYC record found");
      return new Response(JSON.stringify({
        verified: false,
        status: 'not_started'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // If we have a Stripe session, check its status
    if (kycData.stripe_verification_session_id) {
      const verificationSession = await stripe.identity.verificationSessions.retrieve(
        kycData.stripe_verification_session_id
      );
      logStep("Retrieved Stripe verification session", { 
        sessionId: verificationSession.id, 
        status: verificationSession.status 
      });

      let newStatus = kycData.status;
      let verifiedAt = kycData.verified_at;

      // Update status based on Stripe response
      if (verificationSession.status === 'verified' && kycData.status !== 'verified') {
        newStatus = 'verified';
        verifiedAt = new Date().toISOString();
        logStep("Verification completed, updating database");

        // Update KYC record
        await supabaseClient
          .from('kyc_verifications')
          .update({
            status: 'verified',
            verified_at: verifiedAt
          })
          .eq('id', kycData.id);

        // Update profile
        await supabaseClient
          .from('profiles')
          .update({
            kyc_verified: true,
            kyc_verified_at: verifiedAt
          })
          .eq('id', user.id);

        logStep("Updated KYC status to verified");
      } else if (verificationSession.status === 'requires_input') {
        newStatus = 'requires_input';
      } else if (verificationSession.status === 'canceled') {
        newStatus = 'failed';
      }

      return new Response(JSON.stringify({
        verified: newStatus === 'verified',
        status: newStatus,
        verified_at: verifiedAt,
        verification_url: verificationSession.url
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Return current status if no Stripe session
    return new Response(JSON.stringify({
      verified: kycData.status === 'verified',
      status: kycData.status,
      verified_at: kycData.verified_at
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-kyc-status", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});