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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId, newStatus, rejectionReason } = await req.json();

    // Get submission and bounty details
    const { data: submission, error: submissionError } = await supabase
      .from('Submissions')
      .select('hunter_id, bounty_id, message')
      .eq('id', submissionId)
      .single();

    if (submissionError) throw submissionError;

    const { data: bounty, error: bountyError } = await supabase
      .from('Bounties')
      .select('title, poster_id')
      .eq('id', submission.bounty_id)
      .single();

    if (bountyError) throw bountyError;

    // Get hunter email and profile
    const { data: hunterUser, error: hunterError } = await supabase.auth.admin.getUserById(submission.hunter_id);
    if (hunterError) throw hunterError;

    const { data: hunterProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', submission.hunter_id)
      .single();

    const { data: posterProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', bounty.poster_id)
      .single();

    // Send notification email to hunter
    const { error: emailError } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: newStatus === 'accepted' ? 'submission_accepted' : 'submission_rejected',
        recipientEmail: hunterUser.user.email,
        recipientName: hunterProfile?.username || hunterUser.user.email?.split('@')[0] || 'Hunter',
        bountyTitle: bounty.title,
        bountyId: submission.bounty_id,
        submissionId: submissionId,
        senderName: posterProfile?.username || 'Poster',
        rejectionReason: rejectionReason || undefined,
      }
    });

    if (emailError) {
      console.error('Failed to send notification email:', emailError);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error sending submission status notification:', error);
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
