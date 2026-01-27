-- Add a PERMISSIVE policy to allow public/anonymous users to read open bounties
-- This is needed for social media crawlers to fetch bounty data for previews

CREATE POLICY "Allow public read of open bounties for social previews"
ON public."Bounties"
FOR SELECT
TO anon
USING (status = 'open' AND shipping_details IS NULL);