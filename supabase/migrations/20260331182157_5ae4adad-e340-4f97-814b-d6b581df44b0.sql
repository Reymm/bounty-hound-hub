UPDATE "Bounties" SET status = 'cancelled', escrow_status = 'cancelled' WHERE id IN ('dd4c2128-9252-44fe-ab12-f2e172b46fe1', 'cd63c50c-0782-4758-bb02-2cac71f4338b');

UPDATE escrow_transactions SET status = 'cancelled', cancelled_at = now() WHERE bounty_id IN ('dd4c2128-9252-44fe-ab12-f2e172b46fe1', 'cd63c50c-0782-4758-bb02-2cac71f4338b');