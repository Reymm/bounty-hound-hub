-- CRITICAL SECURITY FIX: Admin Privilege Escalation Prevention
-- Fix existing overly permissive policies

-- Drop ALL existing update policies on profiles table
DROP POLICY IF EXISTS "Users can update their own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update safe profile fields only" ON public.profiles;

-- Create new restricted policy for user-editable fields only
CREATE POLICY "Users can update safe profile fields" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- These fields cannot be changed by users (must remain same as current values)
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

-- Create security definer function for secure admin operations
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
  -- Verify current user has admin privileges
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_support_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Update specified admin fields securely
  UPDATE public.profiles 
  SET 
    is_suspended = COALESCE(new_is_suspended, is_suspended),
    suspended_until = COALESCE(new_suspended_until, suspended_until),
    is_support_admin = COALESCE(new_is_support_admin, is_support_admin),
    updated_at = now()
  WHERE id = target_user_id;
  
  -- Log the admin action
  INSERT INTO public.security_audit_log (
    user_id, record_id, table_name, action,
    old_values, new_values
  ) VALUES (
    auth.uid(), target_user_id, 'profiles', 'admin_status_update',
    jsonb_build_object('admin_user', auth.uid()),
    jsonb_build_object(
      'is_suspended', new_is_suspended,
      'suspended_until', new_suspended_until, 
      'is_support_admin', new_is_support_admin
    )
  );
END;
$$;