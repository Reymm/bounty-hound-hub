import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

const createBountyConfirmationHTML = (posterName: string, bountyTitle: string, bountyAmount: number, bountyId: string) => {
  const logoUrl = 'https://lenyuvobgktgdearflim.supabase.co/storage/v1/object/public/email-assets/bountybay-logo.png';
  const primaryBlue = '#1E88E5';
  const bountyUrl = `https://www.bountybay.co/b/${bountyId}`;
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
      <div style="background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid ${primaryBlue};">
        <div style="font-size: 28px; font-weight: 700; color: ${primaryBlue};">BountyBay</div>
      </div>
      <div style="padding: 30px 20px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Your Bounty is Live!</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Congratulations, ${posterName}! Your bounty has been successfully posted. 
          Hunters will start working to help you find what you're looking for.
        </p>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${primaryBlue}; margin: 20px 0;">
          <h3 style="color: #333; margin: 0 0 10px 0;">${bountyTitle}</h3>
          <p style="color: ${primaryBlue}; font-weight: bold; font-size: 18px; margin: 0;">$${bountyAmount.toFixed(2)}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${bountyUrl}" style="background: ${primaryBlue}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Your Bounty</a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If you didn't post this bounty, you can safely ignore this email.<br><br>
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
    const { email, bountyTitle, bountyAmount, bountyId, posterName }: BountyConfirmationRequest = await req.json();

    if (!email || !bountyTitle || !bountyAmount || !bountyId) {
      throw new Error("Missing required fields");
    }

    const name = posterName || "there";
    
    console.log(`Sending bounty confirmation email to: ${email} for bounty: ${bountyId}`);

    const emailResponse = await resend.emails.send({
      from: "BountyBay <notifications@bountybay.co>",
      to: [email],
      subject: `Your Bounty "${bountyTitle}" is Now Live!`,
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
