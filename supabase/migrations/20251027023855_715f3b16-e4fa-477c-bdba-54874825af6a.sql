-- Create security definer function to check if user can view shipping details
CREATE OR REPLACE FUNCTION public.can_view_shipping_details(bounty_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- User can view shipping details if they are:
  -- 1. The bounty poster
  -- 2. An accepted hunter for this bounty
  RETURN EXISTS (
    SELECT 1 FROM public."Bounties" b
    WHERE b.id = bounty_id 
      AND (
        b.poster_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public."Submissions" s
          WHERE s.bounty_id = bounty_id
            AND s.hunter_id = auth.uid()
            AND s.status = 'accepted'
        )
      )
  );
END;
$$;