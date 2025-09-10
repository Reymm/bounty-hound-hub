-- Add admin role system for support management

-- Add admin role to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_support_admin BOOLEAN NOT NULL DEFAULT false;

-- Create admin policies for support_tickets
CREATE POLICY "Support admins can view all tickets"
ON public.support_tickets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_support_admin = true
  )
);

CREATE POLICY "Support admins can update all tickets"
ON public.support_tickets FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_support_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_support_admin = true
  )
);

-- Create admin policies for support_messages
CREATE POLICY "Support admins can view all messages"
ON public.support_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_support_admin = true
  )
);

CREATE POLICY "Support admins can send messages to any ticket"
ON public.support_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_support_admin = true
  )
);

-- Function to get admin ticket overview with message counts and last activity
CREATE OR REPLACE FUNCTION public.get_admin_ticket_overview()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  type support_ticket_type,
  status support_ticket_status,
  priority support_ticket_priority,
  created_by uuid,
  assigned_to uuid,
  bounty_id uuid,
  submission_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  resolved_at timestamptz,
  internal_notes text,
  message_count bigint,
  last_message_at timestamptz,
  last_message_preview text,
  creator_email text,
  bounty_title text
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    st.*,
    COALESCE(msg_stats.message_count, 0) as message_count,
    msg_stats.last_message_at,
    msg_stats.last_message_preview,
    au.email as creator_email,
    b.title as bounty_title
  FROM public.support_tickets st
  LEFT JOIN (
    SELECT 
      ticket_id,
      COUNT(*) as message_count,
      MAX(created_at) as last_message_at,
      (ARRAY_AGG(message ORDER BY created_at DESC))[1] as last_message_preview
    FROM public.support_messages
    GROUP BY ticket_id
  ) msg_stats ON st.id = msg_stats.ticket_id
  LEFT JOIN auth.users au ON st.created_by = au.id
  LEFT JOIN public."Bounties" b ON st.bounty_id = b.id
  WHERE EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_support_admin = true
  )
  ORDER BY st.updated_at DESC;
$$;

-- Function to get full ticket details for admin view
CREATE OR REPLACE FUNCTION public.get_admin_ticket_details(ticket_id_param uuid)
RETURNS TABLE (
  -- Ticket details
  id uuid,
  title text,
  description text,
  type support_ticket_type,
  status support_ticket_status,
  priority support_ticket_priority,
  created_by uuid,
  assigned_to uuid,
  bounty_id uuid,
  submission_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  resolved_at timestamptz,
  internal_notes text,
  -- User details
  creator_email text,
  creator_username text,
  -- Related content
  bounty_title text,
  submission_message text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    st.*,
    au.email as creator_email,
    p.username as creator_username,
    b.title as bounty_title,
    s.message as submission_message
  FROM public.support_tickets st
  LEFT JOIN auth.users au ON st.created_by = au.id
  LEFT JOIN public.profiles p ON st.created_by = p.id
  LEFT JOIN public."Bounties" b ON st.bounty_id = b.id
  LEFT JOIN public."Submissions" s ON st.submission_id = s.id
  WHERE st.id = ticket_id_param
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_support_admin = true
    );
$$;

-- Function for admins to send messages with proper admin flag
CREATE OR REPLACE FUNCTION public.admin_send_message(
  ticket_id_param uuid,
  message_param text,
  attachment_urls_param text[] DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  message_id uuid;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_support_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Insert the message
  INSERT INTO public.support_messages (
    ticket_id,
    sender_id,
    message,
    is_admin_reply,
    attachment_urls
  ) VALUES (
    ticket_id_param,
    auth.uid(),
    message_param,
    true,
    attachment_urls_param
  ) RETURNING id INTO message_id;

  -- Update ticket status if it's waiting for user
  UPDATE public.support_tickets 
  SET status = CASE 
    WHEN status = 'waiting_for_user' THEN 'in_progress'
    ELSE status 
  END
  WHERE id = ticket_id_param;

  RETURN message_id;
END;
$$;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_support_admin ON public.profiles(is_support_admin) WHERE is_support_admin = true;