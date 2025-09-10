import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type AdminTicketOverview = {
  id: string;
  title: string;
  description: string;
  type: Database['public']['Enums']['support_ticket_type'];
  status: Database['public']['Enums']['support_ticket_status'];
  priority: Database['public']['Enums']['support_ticket_priority'];
  created_by: string;
  assigned_to: string | null;
  bounty_id: string | null;
  submission_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  internal_notes: string | null;
  message_count: number;
  last_message_at: string | null;
  last_message_preview: string | null;
  creator_email: string | null;
  bounty_title: string | null;
};

export type AdminTicketDetails = {
  id: string;
  title: string;
  description: string;
  type: Database['public']['Enums']['support_ticket_type'];
  status: Database['public']['Enums']['support_ticket_status'];
  priority: Database['public']['Enums']['support_ticket_priority'];
  created_by: string;
  assigned_to: string | null;
  bounty_id: string | null;
  submission_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  internal_notes: string | null;
  creator_email: string | null;
  creator_username: string | null;
  bounty_title: string | null;
  submission_message: string | null;
};

export type SupportTicketStatus = Database['public']['Enums']['support_ticket_status'];
export type SupportTicketPriority = Database['public']['Enums']['support_ticket_priority'];

export const adminSupportApi = {
  // Check if current user is admin
  async checkAdminStatus(): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_support_admin')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (error) return false;
    return data?.is_support_admin || false;
  },

  // Get all tickets overview for admin
  async getAllTickets(): Promise<AdminTicketOverview[]> {
    const { data, error } = await supabase.rpc('get_admin_ticket_overview');

    if (error) throw error;
    return data || [];
  },

  // Get ticket details for admin
  async getTicketDetails(ticketId: string): Promise<AdminTicketDetails | null> {
    const { data, error } = await supabase.rpc('get_admin_ticket_details', {
      ticket_id_param: ticketId
    });

    if (error) throw error;
    return data?.[0] || null;
  },

  // Get messages for a ticket (admin can see all)
  async getTicketMessages(ticketId: string) {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Send admin message
  async sendAdminMessage(ticketId: string, message: string): Promise<string> {
    const { data, error } = await supabase.rpc('admin_send_message', {
      ticket_id_param: ticketId,
      message_param: message
    });

    if (error) throw error;
    return data;
  },

  // Update ticket status
  async updateTicketStatus(ticketId: string, status: SupportTicketStatus): Promise<void> {
    const updates: any = { status };
    
    if (status === 'resolved' || status === 'closed') {
      updates.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId);

    if (error) throw error;
  },

  // Update ticket priority
  async updateTicketPriority(ticketId: string, priority: SupportTicketPriority): Promise<void> {
    const { error } = await supabase
      .from('support_tickets')
      .update({ priority })
      .eq('id', ticketId);

    if (error) throw error;
  },

  // Update internal notes
  async updateInternalNotes(ticketId: string, notes: string): Promise<void> {
    const { error } = await supabase
      .from('support_tickets')
      .update({ internal_notes: notes })
      .eq('id', ticketId);

    if (error) throw error;
  },

  // Assign ticket to admin
  async assignTicket(ticketId: string, adminId: string | null): Promise<void> {
    const { error } = await supabase
      .from('support_tickets')
      .update({ assigned_to: adminId })
      .eq('id', ticketId);

    if (error) throw error;
  },

  // Get admin stats
  async getAdminStats() {
    const { data: stats, error } = await supabase
      .from('support_tickets')
      .select('status, priority, type, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    if (error) throw error;

    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    
    return {
      totalTickets: stats?.length || 0,
      openTickets: stats?.filter(t => t.status === 'open').length || 0,
      inProgressTickets: stats?.filter(t => t.status === 'in_progress').length || 0,
      resolvedTickets: stats?.filter(t => t.status === 'resolved').length || 0,
      criticalTickets: stats?.filter(t => t.priority === 'critical').length || 0,
      thisWeekTickets: stats?.filter(t => new Date(t.created_at) >= startOfWeek).length || 0,
      ticketsByType: {
        platform_issue: stats?.filter(t => t.type === 'platform_issue').length || 0,
        bounty_dispute: stats?.filter(t => t.type === 'bounty_dispute').length || 0,
        submission_dispute: stats?.filter(t => t.type === 'submission_dispute').length || 0,
        payment_issue: stats?.filter(t => t.type === 'payment_issue').length || 0,
        account_issue: stats?.filter(t => t.type === 'account_issue').length || 0,
        bug_report: stats?.filter(t => t.type === 'bug_report').length || 0,
        feature_request: stats?.filter(t => t.type === 'feature_request').length || 0,
        other: stats?.filter(t => t.type === 'other').length || 0,
      }
    };
  }
};