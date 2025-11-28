-- Fix missing updated_at column on Bounties so triggers and view counter work
ALTER TABLE public."Bounties"
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Drop and recreate the function with prefixed parameter
DROP FUNCTION IF EXISTS public.can_view_shipping_details(uuid);

CREATE FUNCTION public.can_view_shipping_details(p_bounty_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- User can view shipping details if they are:
  -- 1. The bounty poster
  -- 2. An accepted hunter for this bounty
  RETURN EXISTS (
    SELECT 1 FROM public."Bounties" b
    WHERE b.id = p_bounty_id 
      AND (
        b.poster_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public."Submissions" s
          WHERE s.bounty_id = p_bounty_id
            AND s.hunter_id = auth.uid()
            AND s.status = 'accepted'
        )
      )
  );
END;
$function$;