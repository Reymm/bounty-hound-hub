-- Drop the overly restrictive update policy
DROP POLICY IF EXISTS "Users can update safe profile fields" ON public.profiles;

-- Create a simpler, more permissive policy for basic profile updates
CREATE POLICY "Users can update their own basic profile fields"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  -- Ensure protected fields cannot be changed by users
  AND is_support_admin = (SELECT is_support_admin FROM public.profiles WHERE id = auth.uid())
  AND is_suspended = (SELECT is_suspended FROM public.profiles WHERE id = auth.uid())
  AND COALESCE(suspended_until, '1970-01-01'::timestamptz) = COALESCE((SELECT suspended_until FROM public.profiles WHERE id = auth.uid()), '1970-01-01'::timestamptz)
  AND kyc_verified = (SELECT kyc_verified FROM public.profiles WHERE id = auth.uid())
  AND COALESCE(kyc_verified_at, '1970-01-01'::timestamptz) = COALESCE((SELECT kyc_verified_at FROM public.profiles WHERE id = auth.uid()), '1970-01-01'::timestamptz)
  AND reputation_score = (SELECT reputation_score FROM public.profiles WHERE id = auth.uid())
  AND total_successful_claims = (SELECT total_successful_claims FROM public.profiles WHERE id = auth.uid())
  AND total_failed_claims = (SELECT total_failed_claims FROM public.profiles WHERE id = auth.uid())
  AND average_rating = (SELECT average_rating FROM public.profiles WHERE id = auth.uid())
  AND total_ratings_received = (SELECT total_ratings_received FROM public.profiles WHERE id = auth.uid())
  AND total_ratings_given = (SELECT total_ratings_given FROM public.profiles WHERE id = auth.uid())
);