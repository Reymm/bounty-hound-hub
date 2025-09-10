-- Create enum for user report types
CREATE TYPE public.user_report_type AS ENUM (
  'fraud',
  'harassment', 
  'spam',
  'inappropriate_behavior',
  'non_delivery',
  'other'
);

-- Create user_reports table
CREATE TABLE public.user_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  report_type user_report_type NOT NULL,
  description TEXT NOT NULL,
  bounty_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create their own reports" 
ON public.user_reports 
FOR INSERT 
WITH CHECK (reporter_id = auth.uid());

-- Users can view their own reports
CREATE POLICY "Users can view their own reports" 
ON public.user_reports 
FOR SELECT 
USING (reporter_id = auth.uid());

-- Admins can view all reports
CREATE POLICY "Support admins can view all reports" 
ON public.user_reports 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND is_support_admin = true
));

-- Admins can update reports
CREATE POLICY "Support admins can update reports" 
ON public.user_reports 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND is_support_admin = true
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND is_support_admin = true
));

-- Create trigger for updated_at
CREATE TRIGGER update_user_reports_updated_at
  BEFORE UPDATE ON public.user_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for admin queries
CREATE INDEX idx_user_reports_status_created ON public.user_reports(status, created_at DESC);
CREATE INDEXIdx_user_reports_reported_user ON public.user_reports(reported_user_id);

-- Create function to get admin report overview
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
SET search_path = public
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