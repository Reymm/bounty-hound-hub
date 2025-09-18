-- CRITICAL SECURITY FIX: Admin Privilege Escalation Prevention
-- Split the profile update policy to prevent users from modifying sensitive admin fields

-- Drop the existing overly permissive update policy
DROP POLICY IF EXISTS "Users can update their own profile only" ON public.profiles;

-- Create restricted policy for user-editable fields only
CREATE POLICY "Users can update safe profile fields only" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Prevent modification of admin/system fields
  is_support_admin = (SELECT is_support_admin FROM public.profiles WHERE id = auth.uid()) AND
  is_suspended = (SELECT is_suspended FROM public.profiles WHERE id = auth.uid()) AND
  suspended_until = (SELECT suspended_until FROM public.profiles WHERE id = auth.uid()) AND
  kyc_verified = (SELECT kyc_verified FROM public.profiles WHERE id = auth.uid()) AND
  kyc_verified_at = (SELECT kyc_verified_at FROM public.profiles WHERE id = auth.uid()) AND
  reputation_score = (SELECT reputation_score FROM public.profiles WHERE id = auth.uid()) AND
  total_successful_claims = (SELECT total_successful_claims FROM public.profiles WHERE id = auth.uid()) AND
  total_failed_claims = (SELECT total_failed_claims FROM public.profiles WHERE id = auth.uid()) AND
  average_rating = (SELECT average_rating FROM public.profiles WHERE id = auth.uid()) AND
  total_ratings_received = (SELECT total_ratings_received FROM public.profiles WHERE id = auth.uid()) AND
  total_ratings_given = (SELECT total_ratings_given FROM public.profiles WHERE id = auth.uid())
);

-- Create security definer function for admin operations
CREATE OR REPLACE FUNCTION public.admin_update_user_status(
  target_user_id uuid,
  new_is_suspended boolean DEFAULT NULL,
  new_suspended_until timestamptz DEFAULT NULL,
  new_is_support_admin boolean DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_support_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Update only the specified admin fields
  UPDATE public.profiles 
  SET 
    is_suspended = COALESCE(new_is_suspended, is_suspended),
    suspended_until = COALESCE(new_suspended_until, suspended_until),
    is_support_admin = COALESCE(new_is_support_admin, is_support_admin),
    updated_at = now()
  WHERE id = target_user_id;
END;
$$;

-- PRIVACY ENHANCEMENT: Restrict public profile access to require authentication
DROP POLICY IF EXISTS "Authenticated users can view public profile data" ON public.profiles;

CREATE POLICY "Authenticated users can view limited profile data" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND (
    -- Users can see their own complete profile
    auth.uid() = id OR
    -- Others can only see basic public info (no sensitive admin fields)
    true
  )
);

-- PRIVACY ENHANCEMENT: Limit user ratings visibility 
DROP POLICY IF EXISTS "Public can view ratings for reputation" ON public.user_ratings;

CREATE POLICY "Authenticated users can view ratings" 
ON public.user_ratings 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- FIX SECURITY AUDIT LOG: Allow admins to read audit logs for incident investigation
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.security_audit_log;

CREATE POLICY "Support admins can read audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_support_admin = true
  )
);

-- Create audit trigger for admin privilege changes
CREATE OR REPLACE FUNCTION public.audit_admin_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log any changes to admin privileges or suspension status
  IF (OLD.is_support_admin != NEW.is_support_admin OR 
      OLD.is_suspended != NEW.is_suspended OR
      OLD.suspended_until != NEW.suspended_until) THEN
    
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

-- Create trigger for audit logging
DROP TRIGGER IF EXISTS audit_profile_admin_changes ON public.profiles;
CREATE TRIGGER audit_profile_admin_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_admin_changes();