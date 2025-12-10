-- Delete duplicate submissions, keeping only the most recent one per hunter/bounty
DELETE FROM public."Submissions" a
USING (
  SELECT bounty_id, hunter_id, MAX(created_at) as max_created
  FROM public."Submissions"
  GROUP BY bounty_id, hunter_id
  HAVING COUNT(*) > 1
) b
WHERE a.bounty_id = b.bounty_id 
  AND a.hunter_id = b.hunter_id 
  AND a.created_at < b.max_created;

-- Now add unique constraint to prevent future duplicates
ALTER TABLE public."Submissions" 
ADD CONSTRAINT unique_hunter_bounty_submission UNIQUE (bounty_id, hunter_id);