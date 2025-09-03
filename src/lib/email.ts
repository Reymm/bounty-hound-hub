import { supabase } from "@/integrations/supabase/client";

export interface EmailNotificationData {
  type: 'bounty_posted' | 'bounty_claimed' | 'submission_received' | 'bounty_completed';
  recipientEmail: string;
  recipientName: string;
  bountyTitle: string;
  bountyId: string;
  senderName?: string;
  amount?: number;
}

export const sendNotificationEmail = async (data: EmailNotificationData): Promise<boolean> => {
  try {
    console.log('Sending notification email:', data);
    
    const { data: response, error } = await supabase.functions.invoke('send-notification-email', {
      body: data,
    });

    if (error) {
      console.error('Error sending notification email:', error);
      return false;
    }

    if (response?.success) {
      console.log('Email sent successfully:', response.messageId);
      return true;
    } else {
      console.error('Email sending failed:', response?.error);
      return false;
    }
  } catch (error) {
    console.error('Unexpected error sending email:', error);
    return false;
  }
};

// Helper functions for specific notification types
export const notifyBountyPosted = (
  recipientEmail: string,
  recipientName: string,
  bountyTitle: string,
  bountyId: string,
  amount?: number
) => {
  return sendNotificationEmail({
    type: 'bounty_posted',
    recipientEmail,
    recipientName,
    bountyTitle,
    bountyId,
    amount,
  });
};

export const notifyBountyClaimed = (
  bountyOwnerEmail: string,
  bountyOwnerName: string,
  bountyTitle: string,
  bountyId: string,
  claimerName: string
) => {
  return sendNotificationEmail({
    type: 'bounty_claimed',
    recipientEmail: bountyOwnerEmail,
    recipientName: bountyOwnerName,
    bountyTitle,
    bountyId,
    senderName: claimerName,
  });
};

export const notifySubmissionReceived = (
  bountyOwnerEmail: string,
  bountyOwnerName: string,
  bountyTitle: string,
  bountyId: string,
  submitterName: string
) => {
  return sendNotificationEmail({
    type: 'submission_received',
    recipientEmail: bountyOwnerEmail,
    recipientName: bountyOwnerName,
    bountyTitle,
    bountyId,
    senderName: submitterName,
  });
};

export const notifyBountyCompleted = (
  recipientEmail: string,
  recipientName: string,
  bountyTitle: string,
  bountyId: string,
  amount?: number
) => {
  return sendNotificationEmail({
    type: 'bounty_completed',
    recipientEmail,
    recipientName,
    bountyTitle,
    bountyId,
    amount,
  });
};