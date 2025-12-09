-- Create a unique partial index to prevent multiple accepted submissions per bounty
CREATE UNIQUE INDEX unique_accepted_submission_per_bounty 
ON "Submissions" (bounty_id) 
WHERE status = 'accepted';