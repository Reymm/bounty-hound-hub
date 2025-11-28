-- Add RLS policy allowing bounty posters to update submission status
CREATE POLICY "Posters can update submission status"
ON public."Submissions"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public."Bounties" b
    WHERE b.id = "Submissions".bounty_id
    AND b.poster_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."Bounties" b
    WHERE b.id = "Submissions".bounty_id
    AND b.poster_id = auth.uid()
  )
);