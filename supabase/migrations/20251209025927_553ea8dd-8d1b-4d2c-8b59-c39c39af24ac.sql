-- Create a function to get completed bounties for the success stories showcase
-- This bypasses RLS to show public success stories to all users
CREATE OR REPLACE FUNCTION public.get_completed_bounties_showcase(limit_count integer DEFAULT 6)
RETURNS TABLE (
  id uuid,
  title text,
  amount numeric,
  category text,
  images text[],
  completed_at timestamp with time zone,
  hunter_name text,
  poster_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.title,
    b.amount,
    b.category,
    b.images,
    s.updated_at as completed_at,
    COALESCE(hp.username, hp.full_name, 'Anonymous') as hunter_name,
    COALESCE(pp.username, pp.full_name, 'Anonymous') as poster_name
  FROM "Bounties" b
  INNER JOIN "Submissions" s ON s.bounty_id = b.id AND s.status = 'accepted'
  LEFT JOIN profiles hp ON hp.id = s.hunter_id
  LEFT JOIN profiles pp ON pp.id = b.poster_id
  WHERE b.status = 'fulfilled'
  ORDER BY s.updated_at DESC
  LIMIT limit_count;
END;
$$;