import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type SupportTicket = Database['public']['Tables']['support_tickets']['Row'];
export type SupportMessage = Database['public']['Tables']['support_messages']['Row'];
export type CreateSupportTicketData = Database['public']['Tables']['support_tickets']['Insert'];
export type CreateSupportMessageData = Database['public']['Tables']['support_messages']['Insert'];

export type SupportTicketType = Database['public']['Enums']['support_ticket_type'];
export type SupportTicketStatus = Database['public']['Enums']['support_ticket_status'];
export type SupportTicketPriority = Database['public']['Enums']['support_ticket_priority'];

export interface SupportTicketWithMessages extends SupportTicket {
  messages: SupportMessage[];
  bounty?: {
    id: string;
    title: string;
  };
  submission?: {
    id: string;
    message: string;
  };
}

export const supportApi = {
  // Get all tickets for current user
  async getUserTickets(): Promise<SupportTicket[]> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        bounty:Bounties(id, title),
        submission:Submissions(id, message)
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get single ticket with messages
  async getTicket(ticketId: string): Promise<SupportTicketWithMessages | null> {
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select(`
        *,
        bounty:Bounties(id, title),
        submission:Submissions(id, message)
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError) {
      if (ticketError.code === 'PGRST116') return null;
      throw ticketError;
    }

    const { data: messages, error: messagesError } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    return {
      ...ticket,
      messages: messages || []
    } as SupportTicketWithMessages;
  },

  // Create new support ticket
  async createTicket(ticketData: Omit<CreateSupportTicketData, 'created_by'>): Promise<SupportTicket> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        ...ticketData,
        created_by: user.user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Send message to ticket
  async sendMessage(ticketId: string, message: string, attachmentUrls?: string[]): Promise<SupportMessage> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.user.id,
        message,
        attachment_urls: attachmentUrls,
        is_admin_reply: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update ticket status (user can only update their own tickets to certain statuses)
  async updateTicketStatus(ticketId: string, status: SupportTicketStatus): Promise<void> {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status })
      .eq('id', ticketId);

    if (error) throw error;
  },

  // Get user's bounties for linking to tickets
  async getUserBountiesForTicket(): Promise<Array<{ id: string; title: string }>> {
    const { data, error } = await supabase
      .from('Bounties')
      .select('id, title')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  },

  // Get user's submissions for linking to tickets
  async getUserSubmissionsForTicket(): Promise<Array<{ id: string; message: string; bounty_title: string }>> {
    const { data, error } = await supabase
      .from('Submissions')
      .select(`
        id,
        message,
        bounty:Bounties!inner(title)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data?.map(item => ({
      id: item.id,
      message: item.message || '',
      bounty_title: (item.bounty as any)?.title || 'Unknown Bounty'
    })) || [];
  }
};