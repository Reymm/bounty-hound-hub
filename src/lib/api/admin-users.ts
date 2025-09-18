import { supabase } from '@/integrations/supabase/client';

export interface AdminUserManagementRequest {
  userId: string;
  isSuspended?: boolean;
  suspendedUntil?: string | null;
  isSupportAdmin?: boolean;
}

/**
 * Securely update user admin status using the security definer function
 * This prevents privilege escalation attacks
 */
export const updateUserAdminStatus = async ({
  userId,
  isSuspended,
  suspendedUntil,
  isSupportAdmin
}: AdminUserManagementRequest) => {
  const { error } = await supabase.rpc('admin_update_user_status', {
    target_user_id: userId,
    new_is_suspended: isSuspended,
    new_suspended_until: suspendedUntil,
    new_is_support_admin: isSupportAdmin
  });

  if (error) {
    console.error('Admin user status update failed:', error);
    throw error;
  }
};

/**
 * Check if current user has admin privileges using secure function
 */
export const checkAdminPrivileges = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_support_admin');
    
    if (error) {
      console.error('Admin privilege check failed:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Admin privilege check error:', error);
    return false;
  }
};

/**
 * Get security audit logs (admin only)
 */
export const getSecurityAuditLogs = async () => {
  const { data, error } = await supabase
    .from('security_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Failed to fetch audit logs:', error);
    throw error;
  }

  return data;
};