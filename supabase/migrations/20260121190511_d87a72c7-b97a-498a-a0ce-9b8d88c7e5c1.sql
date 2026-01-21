-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can upload bounty images to their folder" ON storage.objects;

-- Create new policy with 20MB limit
CREATE POLICY "Users can upload bounty images to their folder"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'bounty-images' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  -- Limit file size to 20MB
  COALESCE(metadata->>'size', '0')::int < 20971520
);