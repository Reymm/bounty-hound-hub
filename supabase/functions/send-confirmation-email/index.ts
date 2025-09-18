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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .email-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, hsl(214, 84%, 56%) 0%, hsl(214, 84%, 46%) 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .tagline {
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        .confirmation-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, hsl(214, 84%, 56%) 0%, hsl(214, 84%, 46%) 100%);
            border-radius: 50%;
            margin: 0 auto 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 15px;
        }
        .subtitle {
            font-size: 18px;
            color: #666;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        .confirm-button {
            display: inline-block;
            background: linear-gradient(135deg, hsl(214, 84%, 56%) 0%, hsl(214, 84%, 46%) 100%);
            color: white;
            text-decoration: none;
            padding: 18px 40px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 18px;
            margin: 20px 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px hsla(214, 84%, 56%, 0.4);
        }
        .confirm-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px hsla(214, 84%, 56%, 0.6);
        }
        .security-note {
            background: #f8fafc;
            border-left: 4px solid hsl(214, 84%, 56%);
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: left;
        }
        .security-note h4 {
            color: #374151;
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        .security-note p {
            color: #6b7280;
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
        }
        .footer {
            text-align: center;
            color: #9ca3af;
            font-size: 14px;
            padding: 30px;
            border-top: 1px solid #e5e7eb;
            background: #f9fafb;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        .link-fallback {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 12px;
            color: #6b7280;
            word-break: break-all;
        }
        @media (max-width: 600px) {
            .container {
                padding: 20px 10px;
            }
            .content {
                padding: 30px 20px;
            }
            .confirm-button {
                padding: 16px 30px;
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-card">
            <div class="header">
                <div class="logo">BountyBay</div>
                <div class="tagline">Help Find the Unfindable</div>
            </div>
            
            <div class="content">
                <div class="confirmation-icon">
                    ✉️
                </div>
                
                <h1 class="title">Confirm Your Account${name ? `, ${name}` : ''}!</h1>
                <p class="subtitle">
                    You're just one click away from joining BountyBay. Please confirm your email address to activate your account and start exploring exciting opportunities.
                </p>
                
                <a href="${confirmationUrl}" class="confirm-button">
                    ✅ Confirm My Email Address
                </a>
                
                <div class="security-note">
                    <h4>🔒 Security Notice</h4>
                    <p>This confirmation link will expire in 24 hours for your security. If you didn't create a BountyBay account, you can safely ignore this email.</p>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    Once confirmed, you'll be able to:
                </p>
                <div style="color: #374151; font-size: 14px; text-align: left; max-width: 300px; margin: 10px auto;">
                    <div style="margin: 8px 0;">• Browse and claim exciting bounties</div>
                    <div style="margin: 8px 0;">• Build your professional reputation</div>
                    <div style="margin: 8px 0;">• Earn money for your skills</div>
                    <div style="margin: 8px 0;">• Connect with the community</div>
                </div>
            </div>
            
            <div class="footer">
                <p>Having trouble with the button? Copy and paste this link:</p>
                <div class="link-fallback">
                    <a href="${confirmationUrl}" style="color: #667eea;">${confirmationUrl}</a>
                </div>
                
                <p style="margin-top: 20px;">
                    <a href="#">BountyBay</a> | 
                    <a href="#">Support</a> | 
                    <a href="#">Privacy Policy</a>
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