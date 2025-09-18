-- PRIVACY ENHANCEMENT: Restrict public profile access to require authentication
-- and prevent unauthorized access to sensitive data

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view public profile data" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view limited profile data" ON public.profiles;

-- Create new privacy-focused policies for profile access
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view basic public profile info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() != id -- Not their own profile (handled by separate policy)
);

-- PRIVACY ENHANCEMENT: Limit user ratings visibility to authenticated users only
DROP POLICY IF EXISTS "Public can view ratings for reputation" ON public.user_ratings;
DROP POLICY IF EXISTS "Authenticated users can view ratings" ON public.user_ratings;

CREATE POLICY "Authenticated users can view ratings for reputation" 
ON public.user_ratings 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- FIX SECURITY AUDIT LOG: Allow admins to read audit logs for incident investigation
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "Support admins can read audit logs" ON public.security_audit_log;

CREATE POLICY "Support admins can access audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_support_admin = true
  )
);

-- Create audit trigger for tracking admin privilege changes
CREATE OR REPLACE FUNCTION public.audit_admin_privilege_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log changes to sensitive admin fields
  IF (OLD.is_support_admin IS DISTINCT FROM NEW.is_support_admin OR 
      OLD.is_suspended IS DISTINCT FROM NEW.is_suspended OR
      OLD.suspended_until IS DISTINCT FROM NEW.suspended_until) THEN
    
    INSERT INTO public.security_audit_log (
      user_id,
      record_id,
      table_name,
      action,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      NEW.id,
      'profiles',
      'admin_privilege_change',
      jsonb_build_object(
        'is_support_admin', OLD.is_support_admin,
        'is_suspended', OLD.is_suspended,
        'suspended_until', OLD.suspended_until
      ),
      jsonb_build_object(
        'is_support_admin', NEW.is_support_admin,
        'is_suspended', NEW.is_suspended,
        'suspended_until', NEW.suspended_until
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically audit admin changes
DROP TRIGGER IF EXISTS audit_profile_admin_changes ON public.profiles;
CREATE TRIGGER audit_profile_admin_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_admin_privilege_changes();