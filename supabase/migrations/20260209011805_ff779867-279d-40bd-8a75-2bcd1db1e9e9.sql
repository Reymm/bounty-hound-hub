-- Create a public bucket for cached OG images
INSERT INTO storage.buckets (id, name, public)
VALUES ('og-images', 'og-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read OG images (they're public social previews)
CREATE POLICY "OG images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'og-images');

-- Allow the service role to upload (edge function uses service role key)
-- No INSERT policy needed for anon since only the edge function writes via service role
