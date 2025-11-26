-- Fix update_submission_status function to properly handle auth context
CREATE OR REPLACE FUNCTION public.update_submission_status(
  submission_id uuid, 
  new_status text, 
  rejection_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
BEGIN
  -- Check if user is the bounty poster
  IF NOT EXISTS (
    SELECT 1 FROM "Submissions" s
    JOIN "Bounties" b ON b.id = s.bounty_id
    WHERE s.id = submission_id AND b.poster_id = auth.uid()
  ) THEN
    RETURN false;
  END IF;

  -- Update the submission
  UPDATE "Submissions"
  SET 
    status = new_status,
    rejection_reason = CASE WHEN new_status = 'rejected' THEN update_submission_status.rejection_reason ELSE NULL END
  WHERE id = submission_id;

  RETURN FOUND;
END;
$$;