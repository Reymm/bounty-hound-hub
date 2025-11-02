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
      margin: 40px auto;
      background-color: #ffffff;
      padding: 40px;
      text-align: center;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: hsl(214, 84%, 56%);
      margin-bottom: 30px;
    }
    .heading {
      font-size: 32px;
      font-weight: 600;
      color: #1e293b;
      margin: 30px 0 20px;
      line-height: 1.3;
    }
    .subtext {
      font-size: 16px;
      line-height: 1.6;
      color: #64748b;
      margin-bottom: 30px;
    }
    .cta-button {
      display: inline-block;
      background: hsl(214, 84%, 56%);
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
    }
    .footer-text {
      font-size: 14px;
      color: #94a3b8;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">BountyBay</div>
    
    <h1 class="heading">Your Bounty is Live!</h1>
    
    <p class="subtext">
      Congratulations, ${posterName}! Your bounty "${bountyTitle}" for $${bountyAmount.toFixed(2)} has been successfully posted. 
      Hunters will start working to help you find what you're looking for.
    </p>
    
    <a href="https://bountybay.co/b/${bountyId}" class="cta-button" style="color: white !important; text-decoration: none;">
      View Your Bounty
    </a>
    
    <p class="footer-text">
      If you didn't post this bounty, you can safely ignore this email.
    </p>
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
