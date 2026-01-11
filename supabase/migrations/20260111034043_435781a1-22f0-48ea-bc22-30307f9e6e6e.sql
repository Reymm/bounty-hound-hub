-- Add partner commission fields to profiles
ALTER TABLE public.profiles
ADD COLUMN is_partner BOOLEAN DEFAULT false,
ADD COLUMN partner_commission_percent DECIMAL(5,4) DEFAULT NULL,
ADD COLUMN partner_flat_fee_cents INTEGER DEFAULT NULL,
ADD COLUMN partner_name TEXT DEFAULT NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.profiles.is_partner IS 'Whether this user is a referral partner (influencer/community leader)';
COMMENT ON COLUMN public.profiles.partner_commission_percent IS 'Partner cut as decimal of the 5% platform fee (e.g., 0.20 = 20% of 5% = 1% of transaction)';
COMMENT ON COLUMN public.profiles.partner_flat_fee_cents IS 'Partner cut of the $2 flat fee in cents (e.g., 50 = $0.50)';
COMMENT ON COLUMN public.profiles.partner_name IS 'Display name for partner (e.g., "SneakerHeads Community")';