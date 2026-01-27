-- Create a secure function to count submissions for a bounty
-- This allows anyone to get the count without exposing submission details
CREATE OR REPLACE FUNCTION public.get_bounty_claims_count(p_bounty_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COUNT(*)::integer
  FROM public."Submissions"
  WHERE bounty_id = p_bounty_id;
$$;