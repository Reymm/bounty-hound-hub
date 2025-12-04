-- Drop the existing policy
DROP POLICY IF EXISTS "System can complete bounties" ON public."Bounties";

-- Recreate with 'fulfilled' included
CREATE POLICY "System can complete bounties" 
ON public."Bounties" 
FOR UPDATE 
USING (
  (auth.uid() = poster_id) 
  OR (EXISTS (
    SELECT 1 FROM "Submissions" s
    WHERE s.bounty_id = "Bounties".id 
      AND s.hunter_id = auth.uid() 
      AND s.status = 'accepted'
  ))
)
WITH CHECK (
  status = ANY (ARRAY['open', 'closed', 'completed', 'fulfilled'])
);