import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DELETE-ACCOUNT] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const userId = user.id;
    logStep('User authenticated', { userId });

    // Check for active bounties (open with escrow) that would block deletion
    const { data: activeBounties } = await supabase
      .from('Bounties')
      .select('id, status, escrow_status')
      .eq('poster_id', userId)
      .in('status', ['open'])
      .in('escrow_status', ['requires_capture', 'captured']);

    if (activeBounties && activeBounties.length > 0) {
      throw new Error('You have active bounties with funds in escrow. Please cancel or complete them before deleting your account.');
    }

    // Check for active submissions (in-progress claims)
    const { data: activeSubmissions } = await supabase
      .from('Submissions')
      .select('id, status')
      .eq('hunter_id', userId)
      .in('status', ['submitted', 'accepted']);

    if (activeSubmissions && activeSubmissions.length > 0) {
      throw new Error('You have active claims in progress. Please wait for them to be resolved before deleting your account.');
    }

    logStep('Pre-deletion checks passed');

    // 1. Delete user's notifications
    await supabase.from('notifications').delete().eq('user_id', userId);
    logStep('Deleted notifications');

    // 2. Delete saved bounties
    await supabase.from('saved_bounties').delete().eq('user_id', userId);
    logStep('Deleted saved bounties');

    // 3. Delete bounty comments
    await supabase.from('bounty_comments').delete().eq('user_id', userId);
    logStep('Deleted bounty comments');

    // 4. Delete messages (sent and received)
    await supabase.from('messages').delete().or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    logStep('Deleted messages');

    // 5. Delete support messages for user's tickets
    const { data: userTickets } = await supabase
      .from('support_tickets')
      .select('id')
      .eq('created_by', userId);

    if (userTickets && userTickets.length > 0) {
      const ticketIds = userTickets.map(t => t.id);
      await supabase.from('support_messages').delete().in('ticket_id', ticketIds);
      await supabase.from('support_tickets').delete().eq('created_by', userId);
    }
    logStep('Deleted support data');

    // 6. Delete user ratings (given and received)
    await supabase.from('user_ratings').delete().or(`rater_id.eq.${userId},rated_user_id.eq.${userId}`);
    logStep('Deleted ratings');

    // 7. Delete user reports (filed by user)
    await supabase.from('user_reports').delete().eq('reporter_id', userId);
    logStep('Deleted user reports');

    // 8. Delete claim reports
    await supabase.from('claim_reports').delete().eq('reporter_id', userId);
    logStep('Deleted claim reports');

    // 9. Delete user roles
    await supabase.from('user_roles').delete().eq('user_id', userId);
    logStep('Deleted user roles');

    // 10. Delete referrals
    await supabase.from('referrals').delete().eq('referrer_id', userId);
    logStep('Deleted referrals');

    // 11. Cancel remaining open bounties (no escrow)
    await supabase
      .from('Bounties')
      .update({ status: 'cancelled' })
      .eq('poster_id', userId)
      .eq('status', 'open');
    logStep('Cancelled remaining bounties');

    // 12. Delete Stripe Connect account if exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id')
      .eq('id', userId)
      .single();

    if (profile?.stripe_connect_account_id) {
      try {
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (stripeSecretKey) {
          const Stripe = (await import("https://esm.sh/stripe@17.7.0?target=deno&deno-std=0.132.0")).default;
          const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2025-01-27.acacia',
            httpClient: Stripe.createFetchHttpClient(),
          });
          await stripe.accounts.del(profile.stripe_connect_account_id);
          logStep('Deleted Stripe Connect account');
        }
      } catch (stripeError: any) {
        logStep('Stripe deletion warning (non-blocking)', { message: stripeError.message });
      }
    }

    // 13. Delete the profile (must happen before auth deletion)
    // Use service role to bypass RLS "No manual inserts" — we need a direct delete
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    // Profile table has no DELETE RLS policy, so we need to handle this
    // The service role client bypasses RLS, so this should work
    if (profileDeleteError) {
      logStep('Profile deletion error', { error: profileDeleteError.message });
    } else {
      logStep('Deleted profile');
    }

    // 14. Delete the auth user (this is the final step)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      logStep('Auth deletion error', { error: deleteError.message });
      throw new Error(`Failed to delete auth account: ${deleteError.message}`);
    }

    logStep('Account fully deleted', { userId });

    return new Response(JSON.stringify({
      success: true,
      message: 'Your account has been permanently deleted.',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep('Error', { message: error.message });
    return new Response(JSON.stringify({
      error: error.message,
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
