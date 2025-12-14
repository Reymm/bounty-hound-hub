-- Add payout country and email to profiles for hunters
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS payout_country TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payout_email TEXT DEFAULT NULL;

-- Add manual payout tracking to escrow_transactions
ALTER TABLE public.escrow_transactions
ADD COLUMN IF NOT EXISTS payout_method TEXT DEFAULT 'stripe' CHECK (payout_method IN ('stripe', 'manual')),
ADD COLUMN IF NOT EXISTS manual_payout_status TEXT DEFAULT NULL CHECK (manual_payout_status IN ('pending', 'sent', 'confirmed', NULL)),
ADD COLUMN IF NOT EXISTS manual_payout_sent_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS manual_payout_reference TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hunter_payout_email TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hunter_country TEXT DEFAULT NULL;

-- Index for admin to find pending manual payouts quickly
CREATE INDEX IF NOT EXISTS idx_escrow_manual_payout_pending 
ON public.escrow_transactions(manual_payout_status) 
WHERE manual_payout_status = 'pending';