-- Fix function search path security issue
-- This ensures functions can't be hijacked by malicious schema manipulation

-- Update all functions to use secure search_path
CREATE OR REPLACE FUNCTION public.get_public_profile_data(profile_id uuid)
RETURNS TABLE(
  id uuid, 
  username text, 
  avatar_url text, 
  reputation_score numeric, 
  total_successful_claims integer,
  average_rating numeric,
  total_ratings_received integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.reputation_score,
    p.total_successful_claims,
    p.average_rating,
    p.total_ratings_received
  FROM public.profiles p
  WHERE p.id = profile_id;
$function$;

-- Fix other critical functions with search_path issues
CREATE OR REPLACE FUNCTION public.can_user_claim_bounty(user_id uuid, bounty_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;