-- Fix security warnings by setting search_path on functions
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;