import Stripe from "https://esm.sh/stripe@17.7.0?target=deno&deno-std=0.132.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DELETE-CONNECT-ACCOUNT] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      logStep('Auth failed', { error: authError?.message });
      throw new Error('Authentication failed');
    }

    logStep('User authenticated', { userId: user.id });

    // Check if user is admin
    const { data: adminCheck, error: adminError } = await supabase.rpc('is_support_admin', { user_id: user.id });
    
    if (adminError || !adminCheck) {
      logStep('Admin check failed', { error: adminError?.message, isAdmin: adminCheck });
      throw new Error('Admin privileges required');
    }

    logStep('Admin verified');

    // Get the account ID or user ID to delete
    const { stripe_account_id, user_id } = await req.json();
    
    let accountIdToDelete = stripe_account_id;
    let targetUserId = user_id;

    // If user_id provided, look up the account ID
    if (!accountIdToDelete && targetUserId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_connect_account_id')
        .eq('id', targetUserId)
        .single();

      if (profileError || !profile?.stripe_connect_account_id) {
        throw new Error('No Stripe Connect account found for this user');
      }

      accountIdToDelete = profile.stripe_connect_account_id;
      logStep('Found account ID from user profile', { accountIdToDelete });
    }

    if (!accountIdToDelete) {
      throw new Error('Either stripe_account_id or user_id is required');
    }

    // Find the user with this account ID if not provided
    if (!targetUserId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_connect_account_id', accountIdToDelete)
        .single();

      if (profile) {
        targetUserId = profile.id;
      }
    }

    logStep('Deleting Stripe account', { accountIdToDelete, targetUserId });

    // Initialize Stripe and delete the account
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-01-27.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    });

    try {
      await stripe.accounts.del(accountIdToDelete);
      logStep('Stripe account deleted successfully');
    } catch (stripeError: any) {
      logStep('Stripe deletion error', { 
        message: stripeError.message,
        code: stripeError.code 
      });
      
      // If account doesn't exist, we can still clear the database
      if (stripeError.code !== 'resource_missing') {
        throw new Error(`Stripe API error: ${stripeError.message}`);
      }
      
      logStep('Account not found in Stripe, proceeding to clear database');
    }

    // Clear the profile fields
    if (targetUserId) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          stripe_connect_account_id: null,
          stripe_connect_onboarding_complete: false,
          stripe_connect_charges_enabled: false,
          stripe_connect_payouts_enabled: false,
          stripe_connect_details_submitted: false,
          stripe_connect_test_mode: null,
        })
        .eq('id', targetUserId);

      if (updateError) {
        logStep('Database update error', { error: updateError.message });
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      logStep('Profile fields cleared', { targetUserId });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Stripe Connect account deleted and profile reset',
      deleted_account_id: accountIdToDelete,
      reset_user_id: targetUserId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep('Error', { message: error.message });
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
