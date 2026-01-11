-- Create partner applications table
CREATE TABLE public.partner_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  business_name TEXT,
  website_url TEXT,
  social_media_handles TEXT,
  audience_size TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

-- Enable RLS
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit an application (no auth required for potential partners)
CREATE POLICY "Anyone can submit partner applications"
ON public.partner_applications
FOR INSERT
WITH CHECK (true);

-- Only admins can view applications
CREATE POLICY "Admins can view partner applications"
ON public.partner_applications
FOR SELECT
USING (public.is_support_admin(auth.uid()));

-- Only admins can update applications
CREATE POLICY "Admins can update partner applications"
ON public.partner_applications
FOR UPDATE
USING (public.is_support_admin(auth.uid()));