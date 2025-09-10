import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type UserReportType = Database['public']['Enums']['user_report_type'];

export interface CreateUserReportRequest {
  reported_user_id: string;
  report_type: UserReportType;
  description: string;
  bounty_id?: string;
}

export interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  report_type: UserReportType;
  description: string;
  bounty_id?: string;
  status: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface AdminUserReport extends UserReport {
  reporter_email: string;
  reported_user_email: string;
  bounty_title?: string;
}

export const createUserReport = async (data: CreateUserReportRequest) => {
  const { data: report, error } = await supabase
    .from('user_reports')
    .insert({
      reporter_id: (await supabase.auth.getUser()).data.user?.id!,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return report;
};

export const getUserReports = async (): Promise<UserReport[]> => {
  const { data, error } = await supabase
    .from('user_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getAdminUserReports = async (): Promise<AdminUserReport[]> => {
  const { data, error } = await supabase.rpc('get_admin_user_reports');
  
  if (error) throw error;
  return data || [];
};

export const updateUserReportStatus = async (
  reportId: string, 
  status: string, 
  adminNotes?: string
) => {
  const updateData: any = { status };
  if (adminNotes !== undefined) {
    updateData.admin_notes = adminNotes;
  }
  if (status === 'resolved') {
    updateData.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('user_reports')
    .update(updateData)
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data;
};