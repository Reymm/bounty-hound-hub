import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  email: string;
  confirmationUrl: string;
  full_name?: string;
}

const createConfirmationEmailHTML = (name: string, confirmationUrl: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your BountyBay Account</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            padding: 0 20px;
        }
        .email-card {
            background: white;
            border-radius: 8px;
            overflow: hidden;
        }
        .header {
            background: white;
            padding: 40px 40px 20px;
            text-align: center;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 20px;
        }
        .content {
            padding: 20px 40px 40px;
            text-align: center;
        }
        .title {
            font-size: 32px;
            font-weight: bold;
            color: #1a1a1a;
            margin: 0 0 15px 0;
            line-height: 1.2;
        }
        .subtitle {
            font-size: 18px;
            color: #6b7280;
            margin: 0 0 30px 0;
            line-height: 1.5;
        }
        .confirm-button {
            display: inline-block;
            background: #2563eb;
            color: white;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            margin: 10px 0 30px;
        }
        .footer-text {
            color: #9ca3af;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
        }
        @media (max-width: 600px) {
            .container {
                padding: 20px 10px;
            }
            .header, .content {
                padding: 30px 20px;
            }
            .title {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-card">
            <div class="header">
                <div class="logo">BountyBay</div>
            </div>
            
            <div class="content">
                <h1 class="title">Helping People Find the Unfindable.</h1>
                <p class="subtitle">
                    Become a hunter or post what you're trying to find. Click below to confirm your email and get started.
                </p>
                
                <a href="${confirmationUrl}" class="confirm-button">
                    Confirm Email
                </a>
                
                <p class="footer-text">
                    If you didn't create a BountyBay account, you can ignore this email.
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, confirmationUrl, full_name }: ConfirmationEmailRequest = await req.json();

    if (!email || !confirmationUrl) {
      throw new Error("Email and confirmation URL are required");
    }

    console.log('Sending confirmation email to:', email);

    const emailResponse = await resend.emails.send({
      from: "BountyBay <noreply@bountybay.co>",
      to: [email],
      subject: "Confirm your BountyBay account - Welcome aboard!",
      html: createConfirmationEmailHTML(full_name || '', confirmationUrl),
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);