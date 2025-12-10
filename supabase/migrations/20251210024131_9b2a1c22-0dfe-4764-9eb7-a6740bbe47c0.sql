-- Add unique constraint to prevent duplicate submissions per bounty per hunter
ALTER TABLE "Submissions" ADD CONSTRAINT submissions_bounty_hunter_unique UNIQUE (bounty_id, hunter_id);