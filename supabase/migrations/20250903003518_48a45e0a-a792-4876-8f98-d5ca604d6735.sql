-- Create storage buckets for different file types
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('bounty-images', 'bounty-images', true),
  ('submission-files', 'submission-files', false),
  ('avatars', 'avatars', true),
  ('documents', 'documents', false);

-- Storage policies for bounty images (public viewing)
CREATE POLICY "Anyone can view bounty images"
ON storage.objects FOR SELECT
USING (bucket_id = 'bounty-images');

CREATE POLICY "Users can upload bounty images"
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'bounty-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their bounty images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'bounty-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their bounty images"
ON storage.objects FOR DELETE
USING (bucket_id = 'bounty-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for submission files (private between poster and hunter)
CREATE POLICY "Users can view their submission files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'submission-files' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR
   EXISTS (
     SELECT 1 FROM "Submissions" s 
     JOIN "Bounties" b ON s.bounty_id = b.id
     WHERE s.hunter_id = (storage.foldername(name))[1]::uuid
     AND b.poster_id = auth.uid()
   ))
);

CREATE POLICY "Hunters can upload submission files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'submission-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their submission files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'submission-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their submission files"
ON storage.objects FOR DELETE
USING (bucket_id = 'submission-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for avatars (public viewing)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for documents (private access)
CREATE POLICY "Users can view their documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create messages table for direct communication
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  bounty_id uuid REFERENCES public."Bounties"(id) ON DELETE CASCADE,
  content text NOT NULL,
  attachment_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages
CREATE POLICY "Users can view their messages"
ON public.messages FOR SELECT
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their received messages"
ON public.messages FOR UPDATE
USING (recipient_id = auth.uid());

-- Create conversation view for easier querying
CREATE OR REPLACE VIEW public.conversations AS
SELECT DISTINCT
  CASE 
    WHEN sender_id < recipient_id THEN sender_id 
    ELSE recipient_id 
  END as participant_1,
  CASE 
    WHEN sender_id < recipient_id THEN recipient_id 
    ELSE sender_id 
  END as participant_2,
  bounty_id,
  (
    SELECT content 
    FROM public.messages m2 
    WHERE (m2.sender_id = m1.sender_id AND m2.recipient_id = m1.recipient_id)
       OR (m2.sender_id = m1.recipient_id AND m2.recipient_id = m1.sender_id)
    ORDER BY m2.created_at DESC 
    LIMIT 1
  ) as last_message,
  (
    SELECT created_at 
    FROM public.messages m2 
    WHERE (m2.sender_id = m1.sender_id AND m2.recipient_id = m1.recipient_id)
       OR (m2.sender_id = m1.recipient_id AND m2.recipient_id = m1.sender_id)
    ORDER BY m2.created_at DESC 
    LIMIT 1
  ) as last_message_at,
  (
    SELECT COUNT(*) 
    FROM public.messages m2 
    WHERE m2.recipient_id = auth.uid() 
    AND m2.is_read = false
    AND ((m2.sender_id = m1.sender_id AND m2.recipient_id = m1.recipient_id)
         OR (m2.sender_id = m1.recipient_id AND m2.recipient_id = m1.sender_id))
  ) as unread_count
FROM public.messages m1;

-- Enable realtime for messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.messages;

-- Add updated_at trigger for messages
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();