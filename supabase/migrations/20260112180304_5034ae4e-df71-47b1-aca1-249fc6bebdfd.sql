-- Fix: Restrict shipping_details access at database level using RLS
-- Update the Bounties RLS policy to use the bounties_secure view pattern

-- Drop the existing public read policy
DROP POLICY IF EXISTS "Anyone can view open bounties or their own" ON public."Bounties";

-- Create a more restrictive policy that still allows reads but won't include shipping_details for unauthorized users
-- The bounties_secure view already handles this, but we need to ensure direct table access is also protected

-- Policy 1: Allow viewing open bounties (shipping_details should be null for most open bounties anyway)
CREATE POLICY "Public can view open bounties basic info"
ON public."Bounties"
FOR SELECT
USING (status = 'open' AND shipping_details IS NULL);

-- Policy 2: Allow poster to view their own bounties (including shipping details)
CREATE POLICY "Poster can view their own bounties"
ON public."Bounties"
FOR SELECT
USING (poster_id = auth.uid());

-- Policy 3: Allow hunters with submissions to view bounty (excluding shipping unless authorized)
CREATE POLICY "Hunters with submissions can view bounty"
ON public."Bounties"
FOR SELECT
USING (
  user_has_submission_for_bounty(id, auth.uid()) 
  AND (shipping_details IS NULL OR can_view_shipping_details(id))
);

-- Policy 4: Allow viewing fulfilled bounties (public success stories, no shipping details)
CREATE POLICY "Public can view fulfilled bounties"
ON public."Bounties"
FOR SELECT
USING (status = 'fulfilled' AND shipping_details IS NULL);

-- Policy 5: Allow authorized shipping detail access
CREATE POLICY "Authorized users can view shipping details"
ON public."Bounties"
FOR SELECT
USING (
  shipping_details IS NOT NULL 
  AND can_view_shipping_details(id)
);