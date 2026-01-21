-- Clear all related data then bounties
DELETE FROM public."Submissions";
DELETE FROM public.bounty_milestones;
DELETE FROM public.bounty_comments;
DELETE FROM public.saved_bounties;
DELETE FROM public.notifications WHERE bounty_id IS NOT NULL;
DELETE FROM public.escrow_transactions;
DELETE FROM public."Bounties";