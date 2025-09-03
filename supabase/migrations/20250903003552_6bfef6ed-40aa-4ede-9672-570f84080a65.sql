-- Drop the problematic view and recreate without security definer
DROP VIEW IF EXISTS public.conversations;

-- Create a safer function to get conversations for the current user
CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS TABLE (
  participant_1 uuid,
  participant_2 uuid,
  bounty_id uuid,
  last_message text,
  last_message_at timestamp with time zone,
  unread_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
      WHERE (m2.sender_id = auth.uid() AND m2.recipient_id != auth.uid())
         OR (m2.sender_id != auth.uid() AND m2.recipient_id = auth.uid())
      ORDER BY m2.created_at DESC 
      LIMIT 1
    ) as last_message,
    (
      SELECT created_at 
      FROM public.messages m2 
      WHERE (m2.sender_id = auth.uid() AND m2.recipient_id != auth.uid())
         OR (m2.sender_id != auth.uid() AND m2.recipient_id = auth.uid())
      ORDER BY m2.created_at DESC 
      LIMIT 1
    ) as last_message_at,
    (
      SELECT COUNT(*) 
      FROM public.messages m2 
      WHERE m2.recipient_id = auth.uid() 
      AND m2.is_read = false
    ) as unread_count
  FROM public.messages m1
  WHERE m1.sender_id = auth.uid() OR m1.recipient_id = auth.uid();
$$;