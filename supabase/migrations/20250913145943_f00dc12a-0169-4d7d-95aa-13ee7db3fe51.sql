-- Fix ALL remaining functions with search_path security issues
-- This prevents schema hijacking attacks on all database functions

CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS TABLE(participant_1 uuid, participant_2 uuid, bounty_id uuid, last_message text, last_message_at timestamp with time zone, unread_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT DISTINCT
    CASE 
      WHEN m1.sender_id < m1.recipient_id THEN m1.sender_id 
      ELSE m1.recipient_id 
    END as participant_1,
    CASE 
      WHEN m1.sender_id < m1.recipient_id THEN m1.recipient_id 
      ELSE m1.sender_id 
    END as participant_2,
    m1.bounty_id,
    (
      SELECT content 
      FROM public.messages m2 
      WHERE ((m2.sender_id = auth.uid() AND m2.recipient_id != auth.uid())
         OR (m2.sender_id != auth.uid() AND m2.recipient_id = auth.uid()))
        AND m2.bounty_id = m1.bounty_id
      ORDER BY m2.created_at DESC 
      LIMIT 1
    ) as last_message,
    (
      SELECT created_at 
      FROM public.messages m2 
      WHERE ((m2.sender_id = auth.uid() AND m2.recipient_id != auth.uid())
         OR (m2.sender_id != auth.uid() AND m2.recipient_id = auth.uid()))
        AND m2.bounty_id = m1.bounty_id
      ORDER BY m2.created_at DESC 
      LIMIT 1
    ) as last_message_at,
    (
      SELECT COUNT(*) 
      FROM public.messages m2 
      WHERE m2.recipient_id = auth.uid() 
        AND m2.is_read = false
        AND m2.bounty_id = m1.bounty_id
    ) as unread_count
  FROM public.messages m1
  WHERE m1.sender_id = auth.uid() OR m1.recipient_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.update_user_reputation(user_id uuid, rating integer, bounty_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.mark_message_as_read(message_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.messages 
  SET is_read = true 
  WHERE id = message_id 
    AND recipient_id = auth.uid()
    AND is_read = false;
  
  RETURN FOUND;
END;
$function$;