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

const createWelcomeEmailHTML = (name: string) => {
  const logoUrl = 'https://lenyuvobgktgdearflim.supabase.co/storage/v1/object/public/email-assets/bountybay-logo.png';
  const primaryBlue = '#1E88E5';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
      <div style="background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid ${primaryBlue};">
        <div style="font-size: 28px; font-weight: 700; color: ${primaryBlue};">BountyBay</div>
      </div>
      <div style="padding: 30px 20px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Welcome to BountyBay, ${name}!</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Ready to discover unique bounties and earn money for your skills? 
          BountyBay connects talented people like you with those seeking hard-to-find items and specialized services.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${primaryBlue}; margin: 20px 0;">
          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Get Started</h3>
          <ul style="color: #666; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li><strong>Earn Real Money</strong> - Get paid for finding rare items and completing tasks</li>
            <li><strong>Find the Unfindable</strong> - Help others locate hard-to-find items worldwide</li>
            <li><strong>Secure Transactions</strong> - Protected payments through our escrow system</li>
            <li><strong>Build Your Reputation</strong> - Earn ratings to unlock higher-value bounties</li>
          </ul>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #1976d2; font-size: 14px;">
            <strong>Quick Tips:</strong><br>
            • Complete your profile to increase your chances<br>
            • Start with smaller bounties to build reputation<br>
            • Read requirements carefully before claiming<br>
            • Communicate clearly with bounty posters
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://www.bountybay.co" style="background: ${primaryBlue}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Browse Active Bounties</a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Have questions? We're here to help! Contact our support team anytime.<br><br>
          Best regards,<br>
          The BountyBay Team
        </p>
      </div>
    </div>
  `;
};

const handler = async (req: Request): Promise<Response> => {
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
      from: "BountyBay <notifications@bountybay.co>",
      to: [email],
      subject: "Welcome to BountyBay - Your Journey Starts Now!",
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
