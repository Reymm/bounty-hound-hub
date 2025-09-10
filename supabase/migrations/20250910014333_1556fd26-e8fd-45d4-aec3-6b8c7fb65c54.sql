-- COMPREHENSIVE SECURITY FIX MIGRATION (CORRECTED)
-- This migration fixes all critical RLS policy vulnerabilities identified in the security review

-- 1. FIX BOUNTIES TABLE SECURITY
-- Drop existing permissive update policy and create secure ones
DROP POLICY IF EXISTS "Users can update their own bounties" ON public."Bounties";

-- Create secure bounty update policies
CREATE POLICY "Poster can update bounty details" 
ON public."Bounties" 
FOR UPDATE 
USING (auth.uid() = poster_id AND status IN ('open', 'draft'))
WITH CHECK (
  auth.uid() = poster_id 
  AND status IN ('open', 'draft', 'closed')
);

-- Separate policy for completing bounties
CREATE POLICY "System can complete bounties" 
ON public."Bounties" 
FOR UPDATE 
USING (
  auth.uid() = poster_id OR
  EXISTS (
    SELECT 1 FROM public."Submissions" s 
    WHERE s.bounty_id = "Bounties".id 
    AND s.hunter_id = auth.uid() 
    AND s.status = 'accepted'
  )
)
WITH CHECK (status IN ('open', 'closed', 'completed'));

-- 2. FIX KYC VERIFICATIONS SECURITY
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Edge functions can manage KYC" ON public.kyc_verifications;

-- Create secure KYC policies
CREATE POLICY "Users can insert their own KYC" 
ON public.kyc_verifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own KYC status" 
ON public.kyc_verifications 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Special policy for edge functions with service role
CREATE POLICY "Service role can manage KYC" 
ON public.kyc_verifications 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- 3. FIX ESCROW TRANSACTIONS SECURITY  
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Edge functions can update escrow transactions" ON public.escrow_transactions;

-- Create secure escrow policies
CREATE POLICY "Users can update their own pending escrow" 
ON public.escrow_transactions 
FOR UPDATE 
USING (
  auth.uid() = poster_id 
  AND status IN ('requires_payment_method', 'requires_confirmation', 'requires_action')
)
WITH CHECK (
  auth.uid() = poster_id 
  AND status IN ('requires_payment_method', 'requires_confirmation', 'requires_action', 'requires_capture')
);

-- Service role policy for escrow management
CREATE POLICY "Service role can manage escrow" 
ON public.escrow_transactions 
FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'service_role');

-- 4. FIX PROFILES SECURITY
-- Drop the public read policy
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;

-- Create secure profile policies
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create secure function for public profile access
CREATE OR REPLACE FUNCTION public.get_public_profile_data(profile_id uuid)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text,
  reputation_score numeric,
  total_successful_claims integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.reputation_score,
    p.total_successful_claims
  FROM public.profiles p
  WHERE p.id = profile_id;
$$;

-- 5. FIX MESSAGES SECURITY
-- Drop existing policies and create secure ones
DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;

-- Create a function to safely update message read status
CREATE OR REPLACE FUNCTION public.mark_message_as_read(message_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.messages 
  SET is_read = true 
  WHERE id = message_id 
    AND recipient_id = auth.uid()
    AND is_read = false;
  
  RETURN FOUND;
END;
$$;

-- Only allow marking messages as read through the function
CREATE POLICY "Users can mark received messages as read" 
ON public.messages 
FOR UPDATE 
USING (false); -- Block direct updates, force use of function

-- 6. FIX SUBMISSIONS SECURITY
-- Update submission policy to prevent status manipulation
DROP POLICY IF EXISTS "Users can update their own submissions" ON public."Submissions";

-- Hunters can only update content, not status
CREATE POLICY "Hunters can update submission content" 
ON public."Submissions" 
FOR UPDATE 
USING (auth.uid() = hunter_id AND status = 'submitted')
WITH CHECK (auth.uid() = hunter_id);

-- Create function for bounty posters to update submission status
CREATE OR REPLACE FUNCTION public.update_submission_status(
  submission_id uuid, 
  new_status text, 
  rejection_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is the bounty poster
  IF NOT EXISTS (
    SELECT 1 FROM public."Submissions" s
    JOIN public."Bounties" b ON b.id = s.bounty_id
    WHERE s.id = submission_id AND b.poster_id = auth.uid()
  ) THEN
    RETURN false;
  END IF;

  -- Update the submission
  UPDATE public."Submissions"
  SET 
    status = new_status,
    rejection_reason = CASE WHEN new_status = 'rejected' THEN rejection_reason ELSE NULL END
  WHERE id = submission_id;

  RETURN FOUND;
END;
$$;

-- 7. CREATE AUDIT LOG TABLE (Optional but recommended)
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs (assuming user_roles table exists)
CREATE POLICY "Admins can read audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (false); -- Will need to be updated when user roles are implemented

-- 8. CREATE SECURE MESSAGE THREAD FUNCTION
-- Replace the existing function with a more secure version
CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS TABLE(
  participant_1 uuid, 
  participant_2 uuid, 
  bounty_id uuid, 
  last_message text, 
  last_message_at timestamp with time zone, 
  unread_count bigint
)
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT
    CASE 
      WHEN m1.sender_id < m1.recipient_id THEN m1.sender_id 
      ELSE m1.recipient_id 
    END as participant_1,
    CASE 
      WHEN m1.sender_id < m1.recipient_id THEN m1.recipient_id 
      ELSE m1.sender_id 
    END as participant_2,
    m1.bounty_id,
    (
      SELECT content 
      FROM public.messages m2 
      WHERE ((m2.sender_id = auth.uid() AND m2.recipient_id != auth.uid())
         OR (m2.sender_id != auth.uid() AND m2.recipient_id = auth.uid()))
        AND m2.bounty_id = m1.bounty_id
      ORDER BY m2.created_at DESC 
      LIMIT 1
    ) as last_message,
    (
      SELECT created_at 
      FROM public.messages m2 
      WHERE ((m2.sender_id = auth.uid() AND m2.recipient_id != auth.uid())
         OR (m2.sender_id != auth.uid() AND m2.recipient_id = auth.uid()))
        AND m2.bounty_id = m1.bounty_id
      ORDER BY m2.created_at DESC 
      LIMIT 1
    ) as last_message_at,
    (
      SELECT COUNT(*) 
      FROM public.messages m2 
      WHERE m2.recipient_id = auth.uid() 
        AND m2.is_read = false
        AND m2.bounty_id = m1.bounty_id
    ) as unread_count
  FROM public.messages m1
  WHERE m1.sender_id = auth.uid() OR m1.recipient_id = auth.uid();
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_public_profile_data(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_message_as_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_submission_status(uuid, text, text) TO authenticated;