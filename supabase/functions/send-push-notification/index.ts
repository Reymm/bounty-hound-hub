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
  notification_type?: string;
}

// ---------- Firebase HTTP v1 Auth ----------

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
  token_uri: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

function base64url(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.token;
  }

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: sa.token_uri,
      iat: now,
      exp: now + 3600,
    }),
  );

  const signingInput = `${header}.${payload}`;
  const key = await importPrivateKey(sa.private_key);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput));

  const jwt = `${signingInput}.${base64url(new Uint8Array(sig))}`;

  const res = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${txt}`);
  }

  const { access_token, expires_in } = await res.json();
  cachedToken = { token: access_token, expiresAt: now + (expires_in as number) };
  return access_token;
}

// ---------- Main handler ----------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firebaseSaJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');

    if (!firebaseSaJson) {
      return new Response(
        JSON.stringify({ error: 'FIREBASE_SERVICE_ACCOUNT secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const sa: ServiceAccount = JSON.parse(firebaseSaJson);
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { user_id, title, body, data, notification_type } = (await req.json()) as PushPayload;

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id, title, or body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Check user notification preferences
    if (notification_type) {
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select(notification_type)
        .eq('user_id', user_id)
        .maybeSingle();

      if (prefs && prefs[notification_type] === false) {
        return new Response(
          JSON.stringify({ message: 'User has disabled this notification type', sent: 0, skipped: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // Get device tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('device_push_tokens')
      .select('token, platform')
      .eq('user_id', user_id);

    if (tokenError || !tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No device tokens found for user', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Get OAuth2 access token for FCM v1
    const accessToken = await getAccessToken(sa);
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

    let sent = 0;
    const errors: string[] = [];

    for (const deviceToken of tokens) {
      try {
        const message: Record<string, unknown> = {
          token: deviceToken.token,
          notification: { title, body },
          data: data || {},
        };

        // Platform-specific config
        if (deviceToken.platform === 'ios') {
          (message as any).apns = {
            payload: {
              aps: { sound: 'default', badge: 1 },
            },
          };
        } else {
          (message as any).android = {
            priority: 'high',
            notification: { sound: 'default' },
          };
        }

        const fcmResponse = await fetch(fcmUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ message }),
        });

        if (fcmResponse.ok) {
          sent++;
        } else {
          const errBody = await fcmResponse.json();
          const errMsg = errBody?.error?.message || JSON.stringify(errBody);
          errors.push(`Token ${deviceToken.token.slice(0, 8)}...: ${errMsg}`);

          // Clean up invalid tokens
          const errStatus = errBody?.error?.details?.find(
            (d: any) => d.errorCode === 'UNREGISTERED' || d.errorCode === 'INVALID_ARGUMENT',
          );
          if (errStatus || errMsg.includes('not a valid FCM registration token')) {
            await supabase.from('device_push_tokens').delete().eq('token', deviceToken.token);
          }
        }
      } catch (e) {
        errors.push(`Failed to send to ${deviceToken.platform}: ${(e as Error).message}`);
      }
    }

    return new Response(
      JSON.stringify({ sent, total_tokens: tokens.length, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Push notification error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
