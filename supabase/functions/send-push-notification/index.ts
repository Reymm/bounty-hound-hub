import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  // Notification type for preference checking: 'claims' | 'messages' | 'comments' | 'status_updates'
  notification_type?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { user_id, title, body, data, notification_type } = (await req.json()) as PushPayload;

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id, title, or body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user notification preferences if a type is specified
    if (notification_type) {
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select(notification_type)
        .eq('user_id', user_id)
        .maybeSingle();

      // If preferences exist and the type is disabled, skip sending
      if (prefs && prefs[notification_type] === false) {
        return new Response(
          JSON.stringify({ message: 'User has disabled this notification type', sent: 0, skipped: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get all device tokens for this user
    const { data: tokens, error: tokenError } = await supabase
      .from('device_push_tokens')
      .select('token, platform')
      .eq('user_id', user_id);

    if (tokenError || !tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No device tokens found for user', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sent = 0;
    const errors: string[] = [];

    if (fcmServerKey) {
      for (const deviceToken of tokens) {
        try {
          const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `key=${fcmServerKey}`,
            },
            body: JSON.stringify({
              to: deviceToken.token,
              notification: { title, body, sound: 'default', badge: '1' },
              data: data || {},
              priority: 'high',
            }),
          });

          const result = await fcmResponse.json();
          if (result.success === 1) {
            sent++;
          } else {
            errors.push(`Token ${deviceToken.token.slice(0, 8)}...: ${JSON.stringify(result.results)}`);
            if (result.results?.[0]?.error === 'NotRegistered' || result.results?.[0]?.error === 'InvalidRegistration') {
              await supabase.from('device_push_tokens').delete().eq('token', deviceToken.token);
            }
          }
        } catch (e) {
          errors.push(`Failed to send to ${deviceToken.platform}: ${e.message}`);
        }
      }
    } else {
      console.log(`FCM_SERVER_KEY not set. Would send "${title}" to ${tokens.length} device(s).`);
    }

    return new Response(
      JSON.stringify({ sent, total_tokens: tokens.length, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Push notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
