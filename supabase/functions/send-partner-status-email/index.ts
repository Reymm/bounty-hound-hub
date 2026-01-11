import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PartnerStatusEmailRequest {
  email: string;
  name: string;
  status: 'approved' | 'rejected';
  adminNotes?: string;
}

const primaryBlue = '#1E88E5';

const createApprovedEmailHTML = (name: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
      <div style="background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid ${primaryBlue};">
        <div style="font-size: 28px; font-weight: 700; color: ${primaryBlue};">BountyBay</div>
      </div>
      <div style="padding: 30px 20px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">🎉 Congratulations, ${name}!</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Great news! Your partner application has been <strong style="color: #2e7d32;">approved</strong>. 
          Welcome to the BountyBay Partner Program!
        </p>
        
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 20px 0;">
          <h3 style="color: #2e7d32; margin: 0 0 15px 0; font-size: 18px;">Next Steps</h3>
          <ol style="color: #666; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li><strong>Create your account</strong> at BountyBay if you haven't already</li>
            <li><strong>Find your referral link</strong> in your profile settings</li>
            <li><strong>Share with your audience</strong> and start earning commissions</li>
          </ol>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin: 20px 0;">
          <h3 style="color: #333; margin: 0 0 10px 0; font-size: 16px;">How It Works</h3>
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
            When someone signs up using your referral link and completes a bounty, you earn a commission. 
            The more people you refer, the more you earn!
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://www.bountybay.co/auth" style="background: ${primaryBlue}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Get Started</a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Questions about the partner program? Reply to this email and we'll be happy to help.<br><br>
          Welcome aboard!<br>
          The BountyBay Team
        </p>
      </div>
    </div>
  `;
};

const createRejectedEmailHTML = (name: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
      <div style="background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid ${primaryBlue};">
        <div style="font-size: 28px; font-weight: 700; color: ${primaryBlue};">BountyBay</div>
      </div>
      <div style="padding: 30px 20px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Thank You for Your Interest, ${name}</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Thank you for applying to the BountyBay Partner Program. After careful review, 
          we've decided not to move forward with your application at this time.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
            This doesn't mean the door is closed! As we grow and expand the program, 
            we encourage you to apply again in the future. In the meantime, you can still:
          </p>
          <ul style="color: #666; line-height: 1.8; margin: 15px 0 0 0; padding-left: 20px;">
            <li>Use BountyBay to find rare items</li>
            <li>Earn money by completing bounties</li>
            <li>Build your reputation on the platform</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://www.bountybay.co" style="background: ${primaryBlue}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Explore BountyBay</a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Thank you for understanding.<br><br>
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
    const { email, name, status }: PartnerStatusEmailRequest = await req.json();

    if (!email || !name || !status) {
      throw new Error("Email, name, and status are required");
    }

    console.log(`Sending partner ${status} email to: ${email}`);

    const isApproved = status === 'approved';
    const subject = isApproved 
      ? "🎉 Welcome to the BountyBay Partner Program!" 
      : "Update on Your BountyBay Partner Application";
    
    const html = isApproved 
      ? createApprovedEmailHTML(name) 
      : createRejectedEmailHTML(name);

    const emailResponse = await resend.emails.send({
      from: "BountyBay <notifications@bountybay.co>",
      to: [email],
      subject,
      html,
    });

    console.log("Partner status email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Partner ${status} email sent successfully`,
      data: emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-partner-status-email function:", error);
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
