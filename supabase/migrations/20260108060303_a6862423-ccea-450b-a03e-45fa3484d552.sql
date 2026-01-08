-- Add columns for save-card payment model
ALTER TABLE public.escrow_transactions 
ADD COLUMN IF NOT EXISTS stripe_setup_intent_id text,
ADD COLUMN IF NOT EXISTS stripe_payment_method_id text,
ADD COLUMN IF NOT EXISTS card_saved_at timestamptz,
ADD COLUMN IF NOT EXISTS charge_attempted_at timestamptz,
ADD COLUMN IF NOT EXISTS charge_failed_reason text;

-- Add comment explaining the new flow
COMMENT ON COLUMN public.escrow_transactions.stripe_setup_intent_id IS 'SetupIntent ID for saving card (save-card model)';
COMMENT ON COLUMN public.escrow_transactions.stripe_payment_method_id IS 'Saved payment method ID for later charging';
COMMENT ON COLUMN public.escrow_transactions.card_saved_at IS 'When the card was successfully saved';
COMMENT ON COLUMN public.escrow_transactions.charge_attempted_at IS 'When we attempted to charge the saved card';
COMMENT ON COLUMN public.escrow_transactions.charge_failed_reason IS 'Reason for charge failure if any';