-- Fix RLS policies for proper bounty platform functionality

-- Drop existing restrictive bounty policies
DROP POLICY IF EXISTS "bounties_owner" ON public."Bounties";
DROP POLICY IF EXISTS "bounties_insert" ON public."Bounties";

-- Create proper bounty policies
-- Everyone can see open bounties (for browsing/claiming)
CREATE POLICY "Anyone can view open bounties" 
ON public."Bounties" 
FOR SELECT 
USING (status = 'open' OR poster_id = auth.uid());

-- Only authenticated users can insert their own bounties
CREATE POLICY "Users can create their own bounties" 
ON public."Bounties" 
FOR INSERT 
WITH CHECK (auth.uid() = poster_id);

-- Only bounty poster can update their bounty
CREATE POLICY "Users can update their own bounties" 
ON public."Bounties" 
FOR UPDATE 
USING (auth.uid() = poster_id);

-- Fix submission policies
DROP POLICY IF EXISTS "submissions_owner" ON public."Submissions";
DROP POLICY IF EXISTS "submissions_insert" ON public."Submissions";

-- Bounty posters and submission hunters can view submissions
CREATE POLICY "Bounty posters and hunters can view submissions" 
ON public."Submissions" 
FOR SELECT 
USING (
  hunter_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public."Bounties" b 
    WHERE b.id = bounty_id AND b.poster_id = auth.uid()
  )
);

-- Only authenticated users can create submissions
CREATE POLICY "Users can create submissions" 
ON public."Submissions" 
FOR INSERT 
WITH CHECK (auth.uid() = hunter_id);

-- Only hunters can update their own submissions
CREATE POLICY "Users can update their own submissions" 
ON public."Submissions" 
FOR UPDATE 
USING (auth.uid() = hunter_id);