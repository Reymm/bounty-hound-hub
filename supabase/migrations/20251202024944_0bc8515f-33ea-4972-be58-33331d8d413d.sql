-- Add field to track if hunter needs to purchase the item
ALTER TABLE public."Bounties"
ADD COLUMN IF NOT EXISTS hunter_purchases_item boolean DEFAULT false;

COMMENT ON COLUMN public."Bounties".hunter_purchases_item IS 'Whether the hunter is expected to purchase the item (requires purchase reimbursement flow) or just provide information/leads';

-- Add new submission statuses for the purchase flow
-- pending_purchase_funds: Poster approved, waiting to send purchase money
-- purchase_funded: Hunter received purchase money, can now buy item
-- We'll use existing statuses where possible to keep it simple