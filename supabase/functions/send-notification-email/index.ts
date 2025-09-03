import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'bounty_posted' | 'bounty_claimed' | 'submission_received' | 'bounty_completed';
  recipientEmail: string;
  recipientName: string;
  bountyTitle: string;
  bountyId: string;
  senderName?: string;
  amount?: number;
}

const generateEmailContent = (data: EmailRequest) => {
  const baseUrl = 'https://www.bountybay.co';
  const bountyUrl = `${baseUrl}/bounty/${data.bountyId}`;
  
  switch (data.type) {
    case 'bounty_posted':
      return {
        subject: `New Bounty Posted: ${data.bountyTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">BountyBay</h1>
            </div>
            <div style="padding: 30px 20px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">New Bounty Available!</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                A new bounty has been posted that might interest you:
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                <h3 style="color: #333; margin: 0 0 10px 0;">${data.bountyTitle}</h3>
                ${data.amount ? `<p style="color: #28a745; font-weight: bold; font-size: 18px; margin: 0;">$${data.amount}</p>` : ''}
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${bountyUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Bounty</a>
              </div>
              <p style="color: #666; font-size: 14px;">
                Best regards,<br>
                The BountyBay Team
              </p>
            </div>
          </div>
        `
      };

    case 'bounty_claimed':
      return {
        subject: `Your Bounty "${data.bountyTitle}" Has Been Claimed`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">BountyBay</h1>
            </div>
            <div style="padding: 30px 20px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Bounty Claimed!</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Great news! ${data.senderName} has claimed your bounty:
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
                <h3 style="color: #333; margin: 0 0 10px 0;">${data.bountyTitle}</h3>
                <p style="color: #666; margin: 0;">Claimed by: ${data.senderName}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${bountyUrl}" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Details</a>
              </div>
              <p style="color: #666; font-size: 14px;">
                Best regards,<br>
                The BountyBay Team
              </p>
            </div>
          </div>
        `
      };

    case 'submission_received':
      return {
        subject: `New Submission for "${data.bountyTitle}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">BountyBay</h1>
            </div>
            <div style="padding: 30px 20px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">New Submission Received!</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                ${data.senderName} has submitted work for your bounty:
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <h3 style="color: #333; margin: 0 0 10px 0;">${data.bountyTitle}</h3>
                <p style="color: #666; margin: 0;">Submitted by: ${data.senderName}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${bountyUrl}" style="background: #ffc107; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Review Submission</a>
              </div>
              <p style="color: #666; font-size: 14px;">
                Best regards,<br>
                The BountyBay Team
              </p>
            </div>
          </div>
        `
      };

    case 'bounty_completed':
      return {
        subject: `Bounty Completed: "${data.bountyTitle}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">BountyBay</h1>
            </div>
            <div style="padding: 30px 20px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">🎉 Bounty Completed!</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Congratulations! Your bounty has been successfully completed:
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
                <h3 style="color: #333; margin: 0 0 10px 0;">${data.bountyTitle}</h3>
                ${data.amount ? `<p style="color: #28a745; font-weight: bold; font-size: 18px; margin: 0;">Payment: $${data.amount}</p>` : ''}
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${bountyUrl}" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Details</a>
              </div>
              <p style="color: #666; font-size: 14px;">
                Best regards,<br>
                The BountyBay Team
              </p>
            </div>
          </div>
        `
      };

    default:
      throw new Error(`Unknown email type: ${data.type}`);
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received email notification request');
    const emailData: EmailRequest = await req.json();
    console.log('Email data:', emailData);

    // Validate required fields
    if (!emailData.type || !emailData.recipientEmail || !emailData.bountyTitle) {
      throw new Error('Missing required fields: type, recipientEmail, and bountyTitle are required');
    }

    // Generate email content based on type
    const { subject, html } = generateEmailContent(emailData);

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "BountyBay <notifications@bountybay.co>",
      to: [emailData.recipientEmail],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

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
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);