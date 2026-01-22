import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  console.log(`[STRIPE-IDENTITY-WEBHOOK] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  try {
    logStep("Received webhook");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const body = await req.text();
    
    // For now, we'll parse the event directly
    // In production, you should verify the webhook signature
    const event = JSON.parse(body);

    logStep("Parsed event", { type: event.type });

    // Only handle verification session events
    if (!event.type.startsWith("identity.verification_session")) {
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    const session = event.data.object;
    const userId = session.metadata?.user_id;

    if (!userId) {
      logStep("No user_id in metadata, skipping");
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    if (event.type === "identity.verification_session.verified") {
      logStep("Verification successful", { userId, sessionId: session.id });
      
      // Update user's profile
      const { error } = await supabaseClient
        .from("profiles")
        .update({ 
          identity_verified: true,
          identity_session_id: session.id 
        })
        .eq("id", userId);

      if (error) {
        logStep("Error updating profile", { error: error.message });
        throw error;
      }

      logStep("Profile updated successfully");
    } else if (event.type === "identity.verification_session.canceled") {
      logStep("Verification canceled", { userId, sessionId: session.id });
      
      // Clear the session ID so user can start fresh
      await supabaseClient
        .from("profiles")
        .update({ identity_session_id: null })
        .eq("id", userId);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (error: any) {
    logStep("Webhook error", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }
});
