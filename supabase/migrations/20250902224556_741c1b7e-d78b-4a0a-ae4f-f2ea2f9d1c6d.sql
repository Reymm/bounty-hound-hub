-- Add KYC verification tracking to users
CREATE TABLE public.kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_verification_session_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, verified, failed
  verification_type TEXT DEFAULT 'identity_document',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id) -- One verification per user
);

-- Enable RLS
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification status
CREATE POLICY "Users can view their own KYC status" 
ON public.kyc_verifications 
FOR SELECT 
USING (user_id = auth.uid());

-- Edge functions can manage KYC records
CREATE POLICY "Edge functions can manage KYC" 
ON public.kyc_verifications 
FOR ALL 
USING (true);

-- Add KYC status to profiles for easy access
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP WITH TIME ZONE;

-- Add platform fee tracking to escrow transactions
ALTER TABLE public.escrow_transactions 
ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_charged_amount DECIMAL(10,2);

-- Create updated_at trigger for kyc_verifications
CREATE TRIGGER update_kyc_verifications_updated_at
BEFORE UPDATE ON public.kyc_verifications
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();