-- Update RLS policy to allow hunters to view bounties they have submissions for
DROP POLICY IF EXISTS "Anyone can view open bounties" ON public."Bounties";

CREATE POLICY "Anyone can view open bounties or their own" 
ON public."Bounties" 
FOR SELECT 
USING (
  (status = 'open') 
  OR (poster_id = auth.uid())
  OR (status = 'fulfilled')
  OR EXISTS (
    SELECT 1 FROM public."Submissions" s 
    WHERE s.bounty_id = "Bounties".id 
    AND s.hunter_id = auth.uid()
  )
);