-- Reset submission to PENDING so user can accept again and trigger payout
UPDATE "Submissions" 
SET status = 'PENDING'
WHERE bounty_id = '5cc0c313-b6ca-4c80-a53e-2582395d08f2';