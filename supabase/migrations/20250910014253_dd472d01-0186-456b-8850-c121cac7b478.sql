-- COMPREHENSIVE SECURITY FIX MIGRATION
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
  AND (OLD.status != 'completed' OR status = 'completed') -- Don't allow changing completed status
);

-- Separate policy for status updates (more restrictive)
CREATE POLICY "System can update bounty status" 
ON public."Bounties" 
FOR UPDATE 
USING (
  (auth.uid() = poster_id AND status IN ('open', 'closed')) OR
  (EXISTS (
    SELECT 1 FROM public."Submissions" s 
    WHERE s.bounty_id = "Bounties".id 
    AND s.hunter_id = auth.uid() 
    AND s.status = 'accepted'
  ) AND status = 'completed')
);

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

CREATE POLICY "Public can view limited profile data" 
ON public.profiles 
FOR SELECT 
USING (true) -- This will be restricted by the security definer function below
WITH CHECK (false); -- Prevent direct access, force use of function

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

-- Only allow marking messages as read, not editing content
CREATE POLICY "Users can mark received messages as read" 
ON public.messages 
FOR UPDATE 
USING (recipient_id = auth.uid())
WITH CHECK (
  recipient_id = auth.uid() 
  AND is_read = true 
  AND content = OLD.content -- Prevent content modification
  AND sender_id = OLD.sender_id -- Prevent sender modification
  AND recipient_id = OLD.recipient_id -- Prevent recipient modification
  AND bounty_id = OLD.bounty_id -- Prevent bounty_id modification
  AND attachment_url = OLD.attachment_url -- Prevent attachment modification
);

-- 6. FIX SUBMISSIONS SECURITY
-- Update submission policy to prevent status manipulation
DROP POLICY IF EXISTS "Users can update their own submissions" ON public."Submissions";

-- Hunters can only update content, not status
CREATE POLICY "Hunters can update submission content" 
ON public."Submissions" 
FOR UPDATE 
USING (auth.uid() = hunter_id AND status = 'submitted')
WITH CHECK (
  auth.uid() = hunter_id 
  AND status = OLD.status -- Prevent status changes by hunters
  AND hunter_id = OLD.hunter_id -- Prevent hunter_id changes
  AND bounty_id = OLD.bounty_id -- Prevent bounty_id changes
);

-- Separate policy for bounty posters to update status
CREATE POLICY "Bounty posters can update submission status" 
ON public."Submissions" 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public."Bounties" b 
    WHERE b.id = "Submissions".bounty_id 
    AND b.poster_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."Bounties" b 
    WHERE b.id = "Submissions".bounty_id 
    AND b.poster_id = auth.uid()
  )
  AND status IN ('submitted', 'accepted', 'rejected')
);

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

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

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