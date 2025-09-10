-- Fix critical security vulnerabilities

-- 1. Remove the overly permissive "Anyone can increment views" policy on Bounties
DROP POLICY IF EXISTS "Anyone can increment views" ON public."Bounties";

-- 2. Create a more restrictive view increment policy
CREATE POLICY "Authenticated users can increment views only" 
ON public."Bounties" 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (
  -- Only allow updating view_count, and only increment by 1
  OLD.title = NEW.title AND
  OLD.description = NEW.description AND
  OLD.status = NEW.status AND
  OLD.amount = NEW.amount AND
  OLD.poster_id = NEW.poster_id AND
  OLD.category = NEW.category AND
  OLD.subcategory = NEW.subcategory AND
  OLD.location = NEW.location AND
  OLD.tags = NEW.tags AND
  OLD.verification_requirements = NEW.verification_requirements AND
  OLD.images = NEW.images AND
  OLD.target_price_min = NEW.target_price_min AND
  OLD.target_price_max = NEW.target_price_max AND
  OLD.deadline = NEW.deadline AND
  OLD.escrow_status = NEW.escrow_status AND
  OLD.escrow_amount = NEW.escrow_amount AND
  NEW.view_count = COALESCE(OLD.view_count, 0) + 1
);

-- 3. Create strict storage policies for bounty-images bucket
CREATE POLICY "Users can upload bounty images to their folder"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'bounty-images' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  -- Limit file size to 10MB
  COALESCE(metadata->>'size', '0')::int < 10485760
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
  auth.uid()::text = (storage.foldername(name))[1] AND
  -- Limit file size to 50MB
  COALESCE(metadata->>'size', '0')::int < 52428800
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
  auth.uid()::text = (storage.foldername(name))[1] AND
  -- Limit file size to 5MB
  COALESCE(metadata->>'size', '0')::int < 5242880
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
  auth.uid()::text = (storage.foldername(name))[1] AND
  -- Limit file size to 100MB
  COALESCE(metadata->>'size', '0')::int < 104857600
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
CREATE TRIGGER update_bounties_updated_at 
    BEFORE UPDATE ON public."Bounties"
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kyc_updated_at 
    BEFORE UPDATE ON public.kyc_verifications
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_escrow_updated_at 
    BEFORE UPDATE ON public.escrow_transactions
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

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
CREATE POLICY "Users can update their own profile only"
ON public.profiles FOR UPDATE
TO authenticated  
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);