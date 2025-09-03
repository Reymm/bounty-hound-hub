-- Add view counter to Bounties table
ALTER TABLE public."Bounties" ADD COLUMN view_count INTEGER DEFAULT 0;

-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_bounty_views(bounty_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public."Bounties" 
  SET view_count = COALESCE(view_count, 0) + 1 
  WHERE id = bounty_id;
END;
$$;

-- Create RLS policy to allow anyone to call the view increment function
CREATE POLICY "Anyone can increment views" 
ON public."Bounties" 
FOR UPDATE 
USING (true);

-- Add updated_at trigger to Submissions if not exists
CREATE TRIGGER set_submissions_updated_at
  BEFORE UPDATE ON public."Submissions"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();