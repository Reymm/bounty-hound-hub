import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BountyConfirmationRequest {
  email: string;
  bountyTitle: string;
  bountyAmount: number;
  bountyId: string;
  posterName?: string;
}

const createBountyConfirmationHTML = (posterName: string, bountyTitle: string, bountyAmount: number, bountyId: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Bounty is Live!</title>
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
    .bounty-details {
      background-color: #f1f5f9;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .detail-row:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #475569;
    }
    .detail-value {
      color: #1e293b;
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
        <h1 class="greeting">Congratulations, ${posterName}! 🎉</h1>
        
        <p class="text">
          Your bounty has been successfully posted and is now live on BountyBay! 
          Skilled hunters are already being notified and will start working to help you find what you're looking for.
        </p>
        
        <div class="bounty-details">
          <div class="detail-row">
            <span class="detail-label">Bounty Title:</span>
            <span class="detail-value">${bountyTitle}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Bounty Amount:</span>
            <span class="detail-value">$${bountyAmount.toFixed(2)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value" style="color: #10b981; font-weight: 600;">✓ Live & Active</span>
          </div>
        </div>
        
        <div class="features">
          <div class="feature-item">
            <div class="feature-icon">💰</div>
            <div>
              <strong>Funds Secured in Escrow</strong><br>
              Your payment is safely held until you approve a submission.
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🔔</div>
            <div>
              <strong>Get Notified</strong><br>
              You'll receive email updates when hunters submit their findings.
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">✓</div>
            <div>
              <strong>Review & Approve</strong><br>
              Check submissions and approve the one that meets your needs.
            </div>
          </div>
        </div>
        
        <p class="text">
          <strong>What happens next?</strong>
        </p>
        <ul style="color: #475569; line-height: 1.6;">
          <li>Hunters will review your bounty and claim it if they can help</li>
          <li>You'll be notified when submissions come in</li>
          <li>Review each submission and communicate with hunters if needed</li>
          <li>Accept the submission that best meets your requirements</li>
        </ul>
        
        <div style="text-align: center;">
          <a href="https://bountybay.co/b/${bountyId}" class="cta-button">
            View Your Bounty
          </a>
        </div>
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
    const { email, bountyTitle, bountyAmount, bountyId, posterName }: BountyConfirmationRequest = await req.json();

    if (!email || !bountyTitle || !bountyAmount || !bountyId) {
      throw new Error("Missing required fields");
    }

    const name = posterName || "there";
    
    console.log(`Sending bounty confirmation email to: ${email} for bounty: ${bountyId}`);

    const emailResponse = await resend.emails.send({
      from: "BountyBay <noreply@bountybay.co>",
      to: [email],
      subject: `Your Bounty "${bountyTitle}" is Now Live! 🎯`,
      html: createBountyConfirmationHTML(name, bountyTitle, bountyAmount, bountyId),
    });

    console.log("Bounty confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Bounty confirmation email sent successfully",
      data: emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-bounty-confirmation function:", error);
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
