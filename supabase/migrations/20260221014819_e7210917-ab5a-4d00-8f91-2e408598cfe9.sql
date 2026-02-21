
-- Delete related data for bounties being removed
-- Keep: cd63c50c (Axe body spray), 2a8ab2bb (Looney Tunes)

-- Delete messages referencing these bounties
DELETE FROM public.messages WHERE bounty_id IN (
  '2e5d1265-b41b-4653-a2ec-0d27eeeb0322',
  '1dffcd2a-c656-40ba-a066-6954d97fb92d',
  '36b513a7-1e23-4e1b-a900-a612a6ccf4fc'
);

-- Delete notifications referencing these bounties
DELETE FROM public.notifications WHERE bounty_id IN (
  '1dffcd2a-c656-40ba-a066-6954d97fb92d'
);

-- Delete submissions for these bounties
DELETE FROM public."Submissions" WHERE bounty_id NOT IN (
  'cd63c50c-0782-4758-bb02-2cac71f4338b',
  '2a8ab2bb-a4ae-40f7-a194-f47a1dcb05ad'
);

-- Delete escrow transactions for these bounties
DELETE FROM public.escrow_transactions WHERE bounty_id NOT IN (
  'cd63c50c-0782-4758-bb02-2cac71f4338b',
  '2a8ab2bb-a4ae-40f7-a194-f47a1dcb05ad'
);

-- Delete the bounties themselves
DELETE FROM public."Bounties" WHERE id NOT IN (
  'cd63c50c-0782-4758-bb02-2cac71f4338b',
  '2a8ab2bb-a4ae-40f7-a194-f47a1dcb05ad'
);
