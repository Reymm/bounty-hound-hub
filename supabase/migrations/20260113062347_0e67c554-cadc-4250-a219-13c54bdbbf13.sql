-- Drop the existing check constraint and add the new payout method value
ALTER TABLE escrow_transactions DROP CONSTRAINT IF EXISTS escrow_transactions_payout_method_check;

-- Add updated check constraint with new valid values
ALTER TABLE escrow_transactions ADD CONSTRAINT escrow_transactions_payout_method_check 
CHECK (payout_method IN ('stripe', 'manual', 'stripe_destination', 'stripe_destination_poster_pays_fees', 'stripe_separate_transfer', 'stripe_on_behalf_of'));