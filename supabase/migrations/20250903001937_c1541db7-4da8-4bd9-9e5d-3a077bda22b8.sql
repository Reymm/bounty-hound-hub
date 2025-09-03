-- Add anti-spam and reputation columns to profiles
ALTER TABLE public.profiles ADD COLUMN reputation_score DECIMAL(3,2) DEFAULT 5.0;
ALTER TABLE public.profiles ADD COLUMN total_successful_claims INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN total_failed_claims INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN is_suspended BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN suspended_until TIMESTAMP WITH TIME ZONE;

-- Add anti-spam columns to Submissions
ALTER TABLE public."Submissions" ADD COLUMN requires_approval BOOLEAN DEFAULT true;
ALTER TABLE public."Submissions" ADD COLUMN reported_as_spam BOOLEAN DEFAULT false;
ALTER TABLE public."Submissions" ADD COLUMN proof_urls TEXT[];
ALTER TABLE public."Submissions" ADD COLUMN rejection_reason TEXT;

-- Create claim reports table
CREATE TABLE public.claim_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) NOT NULL,
  submission_id UUID REFERENCES public."Submissions"(id) NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved'))
);

ALTER TABLE public.claim_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for claim_reports
CREATE POLICY "Users can create reports" ON public.claim_reports
FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON public.claim_reports
FOR SELECT USING (auth.uid() = reporter_id);

-- Function to check if user can claim bounty (anti-spam)
CREATE OR REPLACE FUNCTION public.can_user_claim_bounty(user_id UUID, bounty_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_rep DECIMAL;
  user_suspended BOOLEAN;
  active_claims INTEGER;
  max_claims INTEGER;
BEGIN
  -- Check if user exists and get reputation
  SELECT reputation_score, is_suspended 
  INTO user_rep, user_suspended
  FROM public.profiles 
  WHERE id = user_id;
  
  -- If user is suspended, they cannot claim
  IF user_suspended THEN
    RETURN FALSE;
  END IF;
  
  -- Count active claims for this user
  SELECT COUNT(*) INTO active_claims
  FROM public."Submissions" 
  WHERE hunter_id = user_id AND status IN ('submitted', 'in_progress');
  
  -- Set max claims based on reputation
  IF user_rep >= 4.5 THEN
    max_claims := 10;
  ELSIF user_rep >= 4.0 THEN
    max_claims := 5;
  ELSIF user_rep >= 3.0 THEN
    max_claims := 3;
  ELSE
    max_claims := 1;
  END IF;
  
  -- Check if user hasn't exceeded claim limit
  RETURN active_claims < max_claims;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user reputation after bounty completion
CREATE OR REPLACE FUNCTION public.update_user_reputation(user_id UUID, rating INTEGER, bounty_amount DECIMAL)
RETURNS VOID AS $$
DECLARE
  current_rep DECIMAL;
  successful_count INTEGER;
  failed_count INTEGER;
  weight_factor DECIMAL;
BEGIN
  -- Get current stats
  SELECT reputation_score, total_successful_claims, total_failed_claims
  INTO current_rep, successful_count, failed_count
  FROM public.profiles WHERE id = user_id;
  
  -- Calculate weight based on bounty amount (higher value = more impact)
  weight_factor := LEAST(bounty_amount / 100.0, 5.0); -- Cap at 5x weight
  
  IF rating >= 4 THEN
    -- Successful completion
    UPDATE public.profiles 
    SET total_successful_claims = successful_count + 1,
        reputation_score = LEAST(5.0, 
          (current_rep * (successful_count + failed_count) + rating * weight_factor) / 
          (successful_count + failed_count + weight_factor)
        )
    WHERE id = user_id;
  ELSE
    -- Failed/poor completion
    UPDATE public.profiles 
    SET total_failed_claims = failed_count + 1,
        reputation_score = GREATEST(1.0,
          (current_rep * (successful_count + failed_count) + rating * weight_factor) / 
          (successful_count + failed_count + weight_factor)
        )
    WHERE id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;