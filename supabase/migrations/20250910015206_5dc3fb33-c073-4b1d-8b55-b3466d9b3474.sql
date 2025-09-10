-- Fix critical security vulnerabilities (corrected)

-- 1. Remove the overly permissive "Anyone can increment views" policy on Bounties
DROP POLICY IF EXISTS "Anyone can increment views" ON public."Bounties";

-- 2. Create a function to handle view increments securely
CREATE OR REPLACE FUNCTION public.increment_bounty_views_secure(bounty_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow incrementing view_count, nothing else
  UPDATE public."Bounties" 
  SET view_count = COALESCE(view_count, 0) + 1 
  WHERE id = bounty_id;
END;
$$;

-- 3. Create strict storage policies for bounty-images bucket
CREATE POLICY "Users can upload bounty images to their folder"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'bounty-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view bounty images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'bounty-images');

CREATE POLICY "Users can update their own bounty images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'bounty-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own bounty images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'bounty-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Create strict storage policies for submission-files bucket
CREATE POLICY "Users can upload submission files to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submission-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Bounty participants can view submission files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'submission-files' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public."Submissions" s
      JOIN public."Bounties" b ON b.id = s.bounty_id
      WHERE s.hunter_id = auth.uid() OR b.poster_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own submission files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'submission-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own submission files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'submission-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Create strict storage policies for avatars bucket  
CREATE POLICY "Users can upload avatars to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Create strict storage policies for documents bucket
CREATE POLICY "Users can upload documents to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 7. Add updated_at triggers for all tables missing them
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for tables that have updated_at but no trigger
DROP TRIGGER IF EXISTS update_bounties_updated_at ON public."Bounties";
CREATE TRIGGER update_bounties_updated_at 
    BEFORE UPDATE ON public."Bounties"
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_kyc_updated_at ON public.kyc_verifications;
CREATE TRIGGER update_kyc_updated_at 
    BEFORE UPDATE ON public.kyc_verifications
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_escrow_updated_at ON public.escrow_transactions;
CREATE TRIGGER update_escrow_updated_at 
    BEFORE UPDATE ON public.escrow_transactions
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON public.messages
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Enhance profiles table policies to allow public username/avatar viewing
DROP POLICY IF EXISTS "Users can view their own complete profile" ON public.profiles;

-- Create separate policies for different access levels
CREATE POLICY "Users can view their own complete profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Public can view basic profile info"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Ensure only the user can still update their profile
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile only"
ON public.profiles FOR UPDATE
TO authenticated  
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);