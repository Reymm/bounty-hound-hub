-- Create support ticket system

-- Support ticket types enum
CREATE TYPE public.support_ticket_type AS ENUM (
  'platform_issue',
  'bounty_dispute',
  'submission_dispute', 
  'payment_issue',
  'account_issue',
  'bug_report',
  'feature_request',
  'other'
);

-- Support ticket status enum
CREATE TYPE public.support_ticket_status AS ENUM (
  'open',
  'in_progress', 
  'waiting_for_user',
  'resolved',
  'closed'
);

-- Support ticket priority enum
CREATE TYPE public.support_ticket_priority AS ENUM (
  'low',
  'medium', 
  'high',
  'critical'
);

-- Support tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type support_ticket_type NOT NULL,
  status support_ticket_status NOT NULL DEFAULT 'open',
  priority support_ticket_priority NOT NULL DEFAULT 'medium',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bounty_id UUID REFERENCES public."Bounties"(id) ON DELETE SET NULL,
  submission_id UUID REFERENCES public."Submissions"(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  internal_notes TEXT -- For admin use only
);

-- Support messages table (chat-style communication)
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_admin_reply BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  attachment_urls TEXT[] -- For file attachments
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own tickets"
ON public.support_tickets FOR SELECT
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can create their own tickets"
ON public.support_tickets FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own open tickets"
ON public.support_tickets FOR UPDATE
TO authenticated
USING (created_by = auth.uid() AND status IN ('open', 'waiting_for_user'))
WITH CHECK (created_by = auth.uid());

-- Admin policies will be added when we implement admin roles

-- RLS Policies for support_messages
CREATE POLICY "Users can view messages for their tickets"
ON public.support_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = support_messages.ticket_id 
    AND st.created_by = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their tickets"
ON public.support_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_id 
    AND st.created_by = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_support_tickets_created_by ON public.support_tickets(created_by);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_type ON public.support_tickets(type);
CREATE INDEX idx_support_tickets_bounty_id ON public.support_tickets(bounty_id);
CREATE INDEX idx_support_tickets_submission_id ON public.support_tickets(submission_id);
CREATE INDEX idx_support_messages_ticket_id ON public.support_messages(ticket_id);

-- Add updated_at trigger
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-update ticket updated_at when messages are added
CREATE OR REPLACE FUNCTION public.update_ticket_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.support_tickets 
  SET updated_at = now()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_ticket_on_new_message
    AFTER INSERT ON public.support_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ticket_on_message();

-- Function to create auto-response message
CREATE OR REPLACE FUNCTION public.create_auto_response()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.support_messages (
    ticket_id,
    sender_id,
    message,
    is_admin_reply
  ) VALUES (
    NEW.id,
    NEW.created_by, -- Will be changed to system user later
    'Thank you for contacting support! We have received your ticket and will get back to you within 24-48 hours. Our team will review your request and respond as soon as possible.',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER create_auto_response_on_ticket
    AFTER INSERT ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.create_auto_response();