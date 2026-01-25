-- Delete the test payment bounty and all related records
-- First delete related records to avoid foreign key violations

-- Delete submissions for this bounty
DELETE FROM "Submissions" WHERE bounty_id = '00ea2662-0281-4f64-80bf-d3d968d50a47';

-- Delete escrow transactions for this bounty
DELETE FROM escrow_transactions WHERE bounty_id = '00ea2662-0281-4f64-80bf-d3d968d50a47';

-- Delete bounty milestones
DELETE FROM bounty_milestones WHERE bounty_id = '00ea2662-0281-4f64-80bf-d3d968d50a47';

-- Delete bounty comments
DELETE FROM bounty_comments WHERE bounty_id = '00ea2662-0281-4f64-80bf-d3d968d50a47';

-- Delete saved bounties references
DELETE FROM saved_bounties WHERE bounty_id = '00ea2662-0281-4f64-80bf-d3d968d50a47';

-- Delete notifications referencing this bounty
DELETE FROM notifications WHERE bounty_id = '00ea2662-0281-4f64-80bf-d3d968d50a47';

-- Delete messages referencing this bounty
DELETE FROM messages WHERE bounty_id = '00ea2662-0281-4f64-80bf-d3d968d50a47';

-- Delete user ratings for this bounty
DELETE FROM user_ratings WHERE bounty_id = '00ea2662-0281-4f64-80bf-d3d968d50a47';

-- Delete support tickets referencing this bounty
DELETE FROM support_tickets WHERE bounty_id = '00ea2662-0281-4f64-80bf-d3d968d50a47';

-- Finally delete the bounty itself
DELETE FROM "Bounties" WHERE id = '00ea2662-0281-4f64-80bf-d3d968d50a47';