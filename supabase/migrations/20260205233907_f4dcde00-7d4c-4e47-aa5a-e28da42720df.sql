-- Update Nixon hoodie bounty amount from $5 to $25 for visual purposes
UPDATE "Bounties" 
SET amount = 25, escrow_amount = 25, updated_at = now()
WHERE id = '36b513a7-1e23-4e1b-a900-a612a6ccf4fc';

-- Update corresponding escrow transaction
UPDATE escrow_transactions 
SET amount = 25, updated_at = now()
WHERE bounty_id = '36b513a7-1e23-4e1b-a900-a612a6ccf4fc';