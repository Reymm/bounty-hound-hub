-- Create referrals table to track referral codes and relationships
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code VARCHAR(20) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reward_amount NUMERIC(10,2) DEFAULT 10.00,
  reward_credited BOOLEAN DEFAULT false,
  reward_credited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_at TIMESTAMP WITH TIME ZONE,
  first_bounty_completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'signed_up', 'completed', 'rewarded'))
);

-- Add referral code to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS referral_credits NUMERIC(10,2) DEFAULT 0;

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code VARCHAR(20) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * 36 + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Create function to assign referral code on profile creation
CREATE OR REPLACE FUNCTION assign_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code VARCHAR(20);
  code_exists BOOLEAN;
BEGIN
  -- Only generate if no code exists
  IF NEW.referral_code IS NULL THEN
    LOOP
      new_code := generate_referral_code();
      SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    NEW.referral_code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-assign referral codes
CREATE TRIGGER trigger_assign_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_referral_code();

-- Generate referral codes for existing profiles that don't have one
DO $$
DECLARE
  profile_record RECORD;
  new_code VARCHAR(20);
  code_exists BOOLEAN;
BEGIN
  FOR profile_record IN SELECT id FROM public.profiles WHERE referral_code IS NULL
  LOOP
    LOOP
      new_code := (SELECT generate_referral_code());
      SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    UPDATE public.profiles SET referral_code = new_code WHERE id = profile_record.id;
  END LOOP;
END;
$$;

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (as referrer)
CREATE POLICY "Users can view their own referrals"
  ON public.referrals FOR SELECT
  USING (referrer_id = auth.uid());

-- Users can view referrals where they are the referred user
CREATE POLICY "Users can see referrals they were referred by"
  ON public.referrals FOR SELECT
  USING (referred_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);