-- Fix: correct status value is 'submitted' not 'PENDING'
UPDATE "Submissions" 
SET status = 'submitted'
WHERE bounty_id = '5cc0c313-b6ca-4c80-a53e-2582395d08f2';