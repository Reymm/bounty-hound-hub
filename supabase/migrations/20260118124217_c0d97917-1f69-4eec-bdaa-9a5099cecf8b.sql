-- Create comments table for bounty discussions
CREATE TABLE public.bounty_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bounty_id UUID NOT NULL REFERENCES public."Bounties"(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bounty_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments on any bounty
CREATE POLICY "Anyone can view comments"
ON public.bounty_comments
FOR SELECT
USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
ON public.bounty_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.bounty_comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.bounty_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_bounty_comments_bounty_id ON public.bounty_comments(bounty_id);
CREATE INDEX idx_bounty_comments_user_id ON public.bounty_comments(user_id);

-- Add updated_at trigger
CREATE TRIGGER update_bounty_comments_updated_at
BEFORE UPDATE ON public.bounty_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();