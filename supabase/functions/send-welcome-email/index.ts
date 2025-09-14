import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  full_name?: string;
}

const createWelcomeEmailHTML = (name: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to BountyBay!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      color: #334155;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
      text-decoration: none;
      color: white;
    }
    .tagline {
      font-size: 16px;
      opacity: 0.9;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1e293b;
    }
    .text {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 20px;
      color: #475569;
    }
    .features {
      background-color: #f1f5f9;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
    .feature-item {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
    .feature-item:last-child {
      margin-bottom: 0;
    }
    .feature-icon {
      width: 20px;
      height: 20px;
      background-color: hsl(214, 84%, 56%);
      border-radius: 50%;
      margin-right: 12px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: bold;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, hsl(214, 84%, 56%) 0%, hsl(214, 84%, 46%) 100%);
      color: white;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-1px);
    }
    .footer {
      background-color: #f8fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }
    .social-links {
      margin-top: 20px;
    }
    .social-link {
      display: inline-block;
      margin: 0 10px;
      color: hsl(214, 84%, 56%);
      text-decoration: none;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div style="padding: 20px;">
    <div class="container">
      <div class="header">
        <div class="logo">BountyBay</div>
        <p class="tagline">Help Find the Unfindable</p>
      </div>
      
      <div class="content">
        <h1 class="greeting">Welcome to BountyBay, ${name}! 🎯</h1>
        
        <p class="text">
          Ready to discover unique bounties and earn money for your skills? 
          BountyBay connects talented people like you with those seeking hard-to-find items and specialized services.
        </p>
        
        <div class="features">
          <div class="feature-item">
            <div class="feature-icon">$</div>
            <div>
              <strong>Earn Real Money</strong><br>
              Get paid for finding rare items, completing tasks, and using your unique skills.
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🔍</div>
            <div>
              <strong>Find the Unfindable</strong><br>
              Help others locate hard-to-find items and rare collectibles worldwide.
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">✓</div>
            <div>
              <strong>Secure Transactions</strong><br>
              Protected payments through our trusted escrow system.
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">★</div>
            <div>
              <strong>Build Your Reputation</strong><br>
              Earn ratings and reviews to unlock higher-value bounties.
            </div>
          </div>
        </div>
        
        <p class="text">
          Ready to dive in? Explore available bounties and start building your success story today!
        </p>
        
        <div style="text-align: center;">
          <a href="https://bountybay.co/active-bounties" class="cta-button">
            Browse Active Bounties
          </a>
        </div>
        
        <p class="text" style="margin-top: 30px;">
          <strong>Quick Tips to Get Started:</strong>
        </p>
        <ul style="color: #475569; line-height: 1.6;">
          <li>Complete your profile to increase your chances of being selected</li>
          <li>Start with smaller bounties to build your reputation</li>
          <li>Read bounty requirements carefully before claiming</li>
          <li>Communicate clearly with bounty posters</li>
        </ul>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          Have questions? We're here to help! Contact our support team anytime.
        </p>
        <div class="social-links">
          <a href="https://bountybay.co/support" class="social-link">Support</a>
          <a href="https://bountybay.co/legal/terms" class="social-link">Terms</a>
          <a href="https://bountybay.co/legal/privacy" class="social-link">Privacy</a>
        </div>
        <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
          © 2024 BountyBay. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, full_name }: WelcomeEmailRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const name = full_name || "there";
    
    console.log(`Sending welcome email to: ${email}`);

    const emailResponse = await resend.emails.send({
      from: "BountyBay <noreply@resend.dev>",
      to: [email],
      subject: "Welcome to BountyBay - Your Journey Starts Now! 🚀",
      html: createWelcomeEmailHTML(name),
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Welcome email sent successfully",
      data: emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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