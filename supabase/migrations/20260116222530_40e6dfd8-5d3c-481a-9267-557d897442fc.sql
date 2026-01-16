-- Reset bounty to allow testing payout again
UPDATE "Bounties" 
SET status = 'ACTIVE'
WHERE id = '5cc0c313-b6ca-4c80-a53e-2582395d08f2';

-- Reset the submission to accepted state (not completed/fulfilled)
UPDATE "Submissions"
SET status = 'ACCEPTED'
WHERE bounty_id = '5cc0c313-b6ca-4c80-a53e-2582395d08f2' 
AND status IN ('COMPLETED', 'FULFILLED');