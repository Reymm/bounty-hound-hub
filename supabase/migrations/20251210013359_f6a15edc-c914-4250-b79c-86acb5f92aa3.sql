-- Create saved_bounties table for hunters to save bounties
CREATE TABLE public.saved_bounties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bounty_id UUID NOT NULL REFERENCES public."Bounties"(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, bounty_id)
);

-- Enable RLS
ALTER TABLE public.saved_bounties ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved bounties
CREATE POLICY "Users can view their own saved bounties"
ON public.saved_bounties
FOR SELECT
USING (auth.uid() = user_id);

-- Users can save bounties
CREATE POLICY "Users can save bounties"
ON public.saved_bounties
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unsave their own bounties
CREATE POLICY "Users can unsave their own bounties"
ON public.saved_bounties
FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_saved_bounties_user_id ON public.saved_bounties(user_id);
CREATE INDEX idx_saved_bounties_bounty_id ON public.saved_bounties(bounty_id);