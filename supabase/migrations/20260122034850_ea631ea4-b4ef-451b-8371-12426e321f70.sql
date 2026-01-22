-- Add Stripe Identity verification fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS identity_session_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.identity_verified IS 'Whether user has completed Stripe Identity photo ID verification';
COMMENT ON COLUMN public.profiles.identity_session_id IS 'Stripe Identity VerificationSession ID for tracking';