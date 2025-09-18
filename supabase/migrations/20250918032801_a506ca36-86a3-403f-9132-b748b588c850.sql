-- PRIVACY ENHANCEMENT: Fix remaining security policies with unique names
-- Drop and recreate policies to avoid conflicts

-- Handle profiles table policies
DROP POLICY IF EXISTS "Users can view their own complete profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view basic public profile info" ON public.profiles;

-- Create new secure profile access policies
CREATE POLICY "Own profile complete access" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Public basic profile view authenticated" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() != id
);

-- Handle user_ratings table policies  
DROP POLICY IF EXISTS "Users can view their ratings" ON public.user_ratings;
DROP POLICY IF EXISTS "Authenticated users can view ratings for reputation" ON public.user_ratings;

CREATE POLICY "Auth users view ratings only" 
ON public.user_ratings 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Handle security_audit_log policies
DROP POLICY IF EXISTS "Support admins can access audit logs" ON public.security_audit_log;

CREATE POLICY "Admin audit log access" 
ON public.security_audit_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_support_admin = true
  )
);

-- Create secure admin verification function to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_support_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_support_admin FROM public.profiles WHERE id = user_id LIMIT 1),
    false
  );
$$;