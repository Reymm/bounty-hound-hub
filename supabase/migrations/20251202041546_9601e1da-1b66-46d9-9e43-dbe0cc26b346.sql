-- Create email-assets storage bucket for email templates
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-assets', 'email-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for email assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload email assets" ON storage.objects;

-- Allow public read access to email assets
CREATE POLICY "Public read access for email assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'email-assets');

-- Allow authenticated users to upload email assets
CREATE POLICY "Authenticated users can upload email assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'email-assets');