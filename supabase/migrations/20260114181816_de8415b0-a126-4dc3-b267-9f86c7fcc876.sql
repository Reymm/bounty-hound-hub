-- Add columns to store pre-calculated charge amounts
ALTER TABLE public.escrow_transactions 
ADD COLUMN IF NOT EXISTS total_charge_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS stripe_fee_amount DECIMAL(10,2);

-- Add comment for documentation
COMMENT ON COLUMN public.escrow_transactions.total_charge_amount IS 'Pre-calculated total charge including Stripe fees (bounty + stripe_fee)';
COMMENT ON COLUMN public.escrow_transactions.stripe_fee_amount IS 'Pre-calculated Stripe processing fee (3.7% + $0.30)';