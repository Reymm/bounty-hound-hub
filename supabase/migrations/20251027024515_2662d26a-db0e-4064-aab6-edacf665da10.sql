-- Fix user_ratings RLS policy to restrict visibility
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Auth users view ratings only" ON public.user_ratings;
DROP POLICY IF EXISTS "Authenticated users can view ratings for reputation" ON public.user_ratings;

-- Create restrictive policy: users can only see ratings they gave or received
CREATE POLICY "Users can view their own rating activity"
ON public.user_ratings
FOR SELECT
TO authenticated
USING (
  auth.uid() = rater_id OR auth.uid() = rated_user_id
);

-- Fix admin_update_user_status function to use transactions
CREATE OR REPLACE FUNCTION public.admin_update_user_status(
  target_user_id uuid,
  new_is_suspended boolean DEFAULT NULL,
  new_suspended_until timestamp with time zone DEFAULT NULL,
  new_is_support_admin boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  old_admin_status boolean;
  old_suspended_status boolean;
  old_suspended_until timestamp with time zone;
BEGIN
  -- Verify current user has admin privileges
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_support_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get old values for audit
  SELECT is_support_admin, is_suspended, suspended_until
  INTO old_admin_status, old_suspended_status, old_suspended_until
  FROM public.profiles
  WHERE id = target_user_id;

  -- BEGIN transaction (implicit in function, but adding error handling)
  BEGIN
    -- Update specified admin fields securely
    UPDATE public.profiles 
    SET 
      is_suspended = COALESCE(new_is_suspended, is_suspended),
      suspended_until = COALESCE(new_suspended_until, suspended_until),
      is_support_admin = COALESCE(new_is_support_admin, is_support_admin),
      updated_at = now()
    WHERE id = target_user_id;
    
    -- Log the admin action (part of same transaction)
    INSERT INTO public.security_audit_log (
      user_id, record_id, table_name, action,
      old_values, new_values
    ) VALUES (
      auth.uid(), target_user_id, 'profiles', 'admin_status_update',
      jsonb_build_object(
        'is_support_admin', old_admin_status,
        'is_suspended', old_suspended_status,
        'suspended_until', old_suspended_until
      ),
      jsonb_build_object(
        'is_suspended', new_is_suspended,
        'suspended_until', new_suspended_until, 
        'is_support_admin', new_is_support_admin
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error and re-raise to rollback transaction
      RAISE WARNING 'Admin status update failed for user %: %', target_user_id, SQLERRM;
      RAISE;
  END;
END;
$$;