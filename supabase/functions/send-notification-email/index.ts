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
  type: 'bounty_posted' | 'bounty_claimed' | 'submission_received' | 'submission_accepted' | 'submission_rejected' | 'shipping_details_provided' | 'bounty_completed' | 'support_ticket_created';
  recipientEmail: string;
  recipientName: string;
  bountyTitle?: string;
  bountyId?: string;
  senderName?: string;
  amount?: number;
  rejectionReason?: string;
  shippingAddress?: string;
  ticketId?: string;
  ticketTitle?: string;
  ticketDescription?: string;
  ticketType?: string;
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
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                <h3 style="color: #333; margin: 0 0 10px 0;">${data.bountyTitle}</h3>
                <p style="color: #666; margin: 0;">Submitted by: ${data.senderName}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${bountyUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Review Submission</a>
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

    case 'submission_accepted':
      return {
        subject: `🎉 Your Submission Was Accepted: "${data.bountyTitle}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">BountyBay</h1>
            </div>
            <div style="padding: 30px 20px; background: #f8f9fa;">
              <h2 style="color: #28a745; margin-bottom: 20px;">🎉 Submission Accepted!</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Congratulations! Your submission has been accepted for:
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
                <h3 style="color: #333; margin: 0 0 10px 0;">${data.bountyTitle}</h3>
                <p style="color: #666; margin: 0;">Accepted by: ${data.senderName}</p>
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

    case 'submission_rejected':
      return {
        subject: `Submission Update Required: "${data.bountyTitle}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">BountyBay</h1>
            </div>
            <div style="padding: 30px 20px; background: #f8f9fa;">
              <h2 style="color: #dc3545; margin-bottom: 20px;">Submission Needs Updates</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Your submission needs some updates for:
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545; margin: 20px 0;">
                <h3 style="color: #333; margin: 0 0 10px 0;">${data.bountyTitle}</h3>
                <p style="color: #666; margin: 0;">Feedback from: ${data.senderName}</p>
                ${data.rejectionReason ? `<div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 4px; border-left: 3px solid #dc3545;"><strong>Feedback:</strong><br>${data.rejectionReason}</div>` : ''}
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${bountyUrl}" style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Update Submission</a>
              </div>
              <p style="color: #666; font-size: 14px;">
                Best regards,<br>
                The BountyBay Team
              </p>
            </div>
          </div>
        `
      };

    case 'shipping_details_provided':
      return {
        subject: `📦 Shipping Details for: "${data.bountyTitle}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">BountyBay</h1>
            </div>
            <div style="padding: 30px 20px; background: #f8f9fa;">
              <h2 style="color: #28a745; margin-bottom: 20px;">📦 Ready to Ship!</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Great news! The bounty poster has provided shipping details for:
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
                <h3 style="color: #333; margin: 0 0 10px 0;">${data.bountyTitle}</h3>
                <p style="color: #666; margin: 0;">Bounty ID: ${data.bountyId}</p>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #dee2e6;">
                <h4 style="margin: 0 0 15px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">📍 Shipping Address:</h4>
                <pre style="margin: 0; white-space: pre-wrap; font-family: 'Courier New', monospace; color: #555; line-height: 1.6; background: #f8f9fa; padding: 15px; border-radius: 4px;">${data.shippingAddress}</pre>
              </div>
              
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #1976d2; font-size: 14px;">
                  <strong>📋 Next Steps:</strong><br>
                  • Package the item securely<br>
                  • Consider using tracking services<br>
                  • Keep shipping receipts for records
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${bountyUrl}" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Bounty Details</a>
              </div>
              <p style="color: #666; font-size: 14px;">
                Best regards,<br>
                The BountyBay Team
              </p>
            </div>
          </div>
        `
      };

    case 'support_ticket_created':
      const ticketUrl = `${baseUrl}/admin/support/${data.ticketId}`;
      return {
        subject: `🚨 New Support Ticket: ${data.ticketTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">BountyBay Admin</h1>
            </div>
            <div style="padding: 30px 20px; background: #f8f9fa;">
              <h2 style="color: #dc3545; margin-bottom: 20px;">🚨 New Support Ticket</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                A new support ticket has been created by ${data.senderName || data.recipientName}:
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545; margin: 20px 0;">
                <h3 style="color: #333; margin: 0 0 10px 0;">${data.ticketTitle}</h3>
                <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">Type: ${data.ticketType || 'General'}</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 15px;">
                  <p style="margin: 0; color: #666; white-space: pre-wrap;">${data.ticketDescription}</p>
                </div>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${ticketUrl}" style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Ticket</a>
              </div>
              <p style="color: #666; font-size: 14px;">
                Respond quickly to maintain user satisfaction!<br><br>
                Best regards,<br>
                The BountyBay System
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
    if (!emailData.type || !emailData.recipientEmail) {
      throw new Error('Missing required fields: type and recipientEmail are required');
    }
    
    // Validate type-specific fields
    if (emailData.type !== 'support_ticket_created' && !emailData.bountyTitle) {
      throw new Error('bountyTitle is required for bounty-related emails');
    }
    
    if (emailData.type === 'support_ticket_created' && !emailData.ticketTitle) {
      throw new Error('ticketTitle is required for support ticket emails');
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