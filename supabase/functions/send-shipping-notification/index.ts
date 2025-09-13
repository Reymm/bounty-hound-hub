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
    const { bountyId, shippingDetails } = await req.json();

    console.log('Processing shipping notification for bounty:', bountyId);

    // Get bounty and hunter details
    const { data: bountyData, error: bountyError } = await supabase
      .from('Bounties')
      .select('title, poster_id')
      .eq('id', bountyId)
      .single();

    if (bountyError) {
      console.error('Error fetching bounty:', bountyError);
      throw bountyError;
    }

    // Get accepted submission to find the hunter
    const { data: submissionData, error: submissionError } = await supabase
      .from('Submissions')
      .select('hunter_id')
      .eq('bounty_id', bountyId)
      .eq('status', 'accepted')
      .single();

    if (submissionError) {
      console.error('Error fetching submission:', submissionError);
      throw submissionError;
    }

    // Get poster and hunter user details
    const { data: posterUser, error: posterError } = await supabase.auth.admin.getUserById(bountyData.poster_id);
    const { data: hunterUser, error: hunterError } = await supabase.auth.admin.getUserById(submissionData.hunter_id);
    
    if (posterError || hunterError) {
      console.error('Error fetching user data:', { posterError, hunterError });
      throw posterError || hunterError;
    }

    // Format shipping address
    const shippingAddress = `${shippingDetails.name}
${shippingDetails.address}
${shippingDetails.city}, ${shippingDetails.state} ${shippingDetails.postalCode}
${shippingDetails.country}${shippingDetails.phone ? `\nPhone: ${shippingDetails.phone}` : ''}${shippingDetails.notes ? `\n\nSpecial Instructions: ${shippingDetails.notes}` : ''}`;

    // Send notification email to hunter
    const { error: emailError } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'shipping_details_provided',
        recipientEmail: hunterUser.user.email,
        recipientName: hunterUser.user.email?.split('@')[0] || 'Hunter',
        bountyTitle: bountyData.title,
        bountyId: bountyId,
        senderName: posterUser.user.email?.split('@')[0] || 'Poster',
        shippingAddress: shippingAddress
      }
    });

    if (emailError) {
      console.error('Failed to send shipping notification email:', emailError);
      // Don't throw error - shipping details were still saved
    }

    console.log('Shipping notification sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Shipping notification sent successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error sending shipping notification:', error);
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