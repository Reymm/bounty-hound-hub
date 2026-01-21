-- Add partner attribution tracking to escrow transactions
ALTER TABLE public.escrow_transactions 
ADD COLUMN IF NOT EXISTS referred_by_partner_id UUID REFERENCES public.profiles(id);

-- Add index for efficient partner queries
CREATE INDEX IF NOT EXISTS idx_escrow_partner ON public.escrow_transactions(referred_by_partner_id) 
WHERE referred_by_partner_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.escrow_transactions.referred_by_partner_id IS 'The partner who referred the hunter that completed this bounty, for affiliate commission tracking';