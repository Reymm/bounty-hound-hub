import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bountyId, hunterId, submissionId } = await req.json();

    // Get bounty and poster details
    const { data: bountyData, error: bountyError } = await supabase
      .from('Bounties')
      .select('title, poster_id')
      .eq('id', bountyId)
      .single();

    if (bountyError) throw bountyError;

    // Get poster email
    const { data: posterUser, error: posterError } = await supabase.auth.admin.getUserById(bountyData.poster_id);
    
    if (posterError) throw posterError;

    // Get hunter and poster profiles for usernames
    const { data: hunterProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', hunterId)
      .single();

    const { data: posterProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', bountyData.poster_id)
      .single();

    // Create in-app notification for bounty poster
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: bountyData.poster_id,
        type: 'submission_received',
        title: 'New Claim Submitted',
        message: `${hunterProfile?.username || 'A hunter'} submitted a claim for "${bountyData.title}"`,
        bounty_id: bountyId,
        submission_id: submissionId,
        is_read: false
      });

    if (notificationError) {
      console.error('Failed to create in-app notification:', notificationError);
    }

    // Send notification email to bounty poster
    const { error: emailError } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'submission_received',
        recipientEmail: posterUser.user.email,
        recipientName: posterProfile?.username || posterUser.user.email?.split('@')[0] || 'User',
        bountyTitle: bountyData.title,
        bountyId: bountyId,
        senderName: hunterProfile?.username || 'Hunter',
      }
    });

    if (emailError) {
      console.error('Failed to send notification email:', emailError);
    }

    // Send push notification to bounty poster's device(s)
    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: bountyData.poster_id,
          title: 'New Claim Submitted 🎯',
          body: `${hunterProfile?.username || 'A hunter'} submitted a claim for "${bountyData.title}"`,
          data: { bountyId, submissionId, route: `/b/${bountyId}` },
          notification_type: 'claims',
        }
      });
    } catch (pushError) {
      console.error('Push notification failed (non-blocking):', pushError);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error sending submission notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);