-- Allow the bounty poster to delete their own bounties 
-- This is needed for demo seeding cleanup and general bounty management
CREATE POLICY "Poster can delete their own bounties"
ON public."Bounties"
FOR DELETE
USING (auth.uid() = poster_id);