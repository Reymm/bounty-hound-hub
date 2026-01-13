-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments', 
  'message-attachments', 
  false,  -- Private bucket - only participants can view
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']  -- Images only
);

-- RLS policy: Users can upload to their own folder
CREATE POLICY "Users can upload their own message attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'message-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policy: Users can view attachments where they are sender or recipient
-- We'll store files as: {sender_id}/{recipient_id}/{filename}
-- Either participant can view
CREATE POLICY "Participants can view message attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'message-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]  -- sender
    OR auth.uid()::text = (storage.foldername(name))[2]  -- recipient
  )
);

-- RLS policy: Users can delete their own uploads
CREATE POLICY "Users can delete their own message attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'message-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);