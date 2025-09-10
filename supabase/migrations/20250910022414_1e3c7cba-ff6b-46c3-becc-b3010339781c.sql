-- Fix search path security issue for the function
CREATE OR REPLACE FUNCTION public.get_admin_user_reports()
RETURNS TABLE(
  id UUID,
  reporter_id UUID,
  reported_user_id UUID,
  report_type user_report_type,
  description TEXT,
  bounty_id UUID,
  status TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  reporter_email TEXT,
  reported_user_email TEXT,
  bounty_title TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public  -- This fixes the security warning
AS $$
  SELECT 
    ur.*,
    reporter_auth.email as reporter_email,
    reported_auth.email as reported_user_email,
    b.title as bounty_title
  FROM public.user_reports ur
  LEFT JOIN auth.users reporter_auth ON ur.reporter_id = reporter_auth.id
  LEFT JOIN auth.users reported_auth ON ur.reported_user_id = reported_auth.id
  LEFT JOIN public."Bounties" b ON ur.bounty_id = b.id
  WHERE EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_support_admin = true
  )
  ORDER BY ur.created_at DESC;
$$;