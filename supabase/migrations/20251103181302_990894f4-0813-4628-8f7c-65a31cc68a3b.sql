-- Add Stripe Connect fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_connect_details_submitted BOOLEAN DEFAULT FALSE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_connect 
ON public.profiles(stripe_connect_account_id) 
WHERE stripe_connect_account_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.stripe_connect_account_id IS 'Stripe Connect Express account ID for receiving payouts';
COMMENT ON COLUMN public.profiles.stripe_connect_onboarding_complete IS 'Whether the user has completed Stripe Connect onboarding';
COMMENT ON COLUMN public.profiles.stripe_connect_charges_enabled IS 'Whether the Connect account can accept charges';
COMMENT ON COLUMN public.profiles.stripe_connect_payouts_enabled IS 'Whether the Connect account can receive payouts';
COMMENT ON COLUMN public.profiles.stripe_connect_details_submitted IS 'Whether the user has submitted their details to Stripe';