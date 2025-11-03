-- Drop and recreate the view counter function to fix ambiguous column reference
DROP FUNCTION IF EXISTS public.increment_bounty_views_secure(uuid);

CREATE OR REPLACE FUNCTION public.increment_bounty_views_secure(p_bounty_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow incrementing view_count, nothing else
  -- Use p_ prefix to avoid ambiguity with column names
  UPDATE public."Bounties" 
  SET view_count = COALESCE(view_count, 0) + 1 
  WHERE id = p_bounty_id;
END;
$$;