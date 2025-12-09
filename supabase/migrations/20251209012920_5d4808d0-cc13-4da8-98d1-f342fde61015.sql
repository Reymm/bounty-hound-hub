-- Create a security definer function to check if user has a submission for a bounty
CREATE OR REPLACE FUNCTION public.user_has_submission_for_bounty(p_bounty_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM "Submissions"
    WHERE bounty_id = p_bounty_id
      AND hunter_id = p_user_id
  )
$$;

-- Drop and recreate the Bounties policy using the function
DROP POLICY IF EXISTS "Anyone can view open bounties or their own" ON public."Bounties";

CREATE POLICY "Anyone can view open bounties or their own" 
ON public."Bounties" 
FOR SELECT 
USING (
  (status = 'open') 
  OR (poster_id = auth.uid())
  OR (status = 'fulfilled')
  OR public.user_has_submission_for_bounty(id, auth.uid())
);

-- Also fix the Submissions policy to use a security definer function
CREATE OR REPLACE FUNCTION public.user_is_bounty_poster(p_bounty_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM "Bounties"
    WHERE id = p_bounty_id
      AND poster_id = p_user_id
  )
$$;

-- Drop and recreate Submissions SELECT policy
DROP POLICY IF EXISTS "Bounty posters and hunters can view submissions" ON public."Submissions";

CREATE POLICY "Bounty posters and hunters can view submissions" 
ON public."Submissions" 
FOR SELECT 
USING (
  (hunter_id = auth.uid()) 
  OR public.user_is_bounty_poster(bounty_id, auth.uid())
);