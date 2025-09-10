-- Create ratings table for user-to-user ratings
CREATE TABLE public.user_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rater_id UUID NOT NULL, -- User giving the rating
  rated_user_id UUID NOT NULL, -- User being rated
  bounty_id UUID NOT NULL, -- Bounty this rating is for
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  rating_type TEXT NOT NULL CHECK (rating_type IN ('poster_to_hunter', 'hunter_to_poster')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one rating per user pair per bounty per direction
  UNIQUE(rater_id, rated_user_id, bounty_id, rating_type)
);

-- Enable RLS
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

-- Users can create ratings for bounties they're involved in
CREATE POLICY "Users can rate others on their bounties" 
ON public.user_ratings 
FOR INSERT 
WITH CHECK (
  rater_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public."Bounties" b
    LEFT JOIN public."Submissions" s ON b.id = s.bounty_id
    WHERE b.id = bounty_id AND (
      (rating_type = 'poster_to_hunter' AND b.poster_id = auth.uid() AND s.hunter_id = rated_user_id AND s.status = 'accepted') OR
      (rating_type = 'hunter_to_poster' AND s.hunter_id = auth.uid() AND b.poster_id = rated_user_id AND s.status = 'accepted')
    )
  )
);

-- Users can view ratings they gave or received
CREATE POLICY "Users can view their ratings" 
ON public.user_ratings 
FOR SELECT 
USING (rater_id = auth.uid() OR rated_user_id = auth.uid());

-- Public can view ratings (for displaying on profiles)
CREATE POLICY "Public can view ratings for reputation" 
ON public.user_ratings 
FOR SELECT 
USING (true);

-- Users can update their own ratings within 24 hours
CREATE POLICY "Users can update recent ratings" 
ON public.user_ratings 
FOR UPDATE 
USING (
  rater_id = auth.uid() AND 
  created_at > now() - interval '24 hours'
)
WITH CHECK (rater_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_user_ratings_updated_at
  BEFORE UPDATE ON public.user_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_user_ratings_rated_user ON public.user_ratings(rated_user_id);
CREATE INDEX idx_user_ratings_bounty ON public.user_ratings(bounty_id);
CREATE INDEX idx_user_ratings_created_at ON public.user_ratings(created_at DESC);

-- Add rating statistics to profiles
ALTER TABLE public.profiles 
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 5.0,
ADD COLUMN total_ratings_received INTEGER DEFAULT 0,
ADD COLUMN total_ratings_given INTEGER DEFAULT 0;

-- Create function to recalculate user ratings
CREATE OR REPLACE FUNCTION public.recalculate_user_rating(user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  rating_count INTEGER;
BEGIN
  -- Calculate average rating and count
  SELECT 
    COALESCE(AVG(rating::DECIMAL), 5.0),
    COALESCE(COUNT(*), 0)
  INTO avg_rating, rating_count
  FROM public.user_ratings 
  WHERE rated_user_id = user_id_param;
  
  -- Update user profile
  UPDATE public.profiles 
  SET 
    average_rating = avg_rating,
    total_ratings_received = rating_count,
    updated_at = now()
  WHERE id = user_id_param;
  
  -- Update ratings given count
  UPDATE public.profiles 
  SET 
    total_ratings_given = (
      SELECT COUNT(*) FROM public.user_ratings WHERE rater_id = user_id_param
    ),
    updated_at = now()
  WHERE id = user_id_param;
END;
$$;

-- Create function to update ratings after new rating
CREATE OR REPLACE FUNCTION public.update_ratings_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Recalculate ratings for both users
  PERFORM public.recalculate_user_rating(NEW.rated_user_id);
  PERFORM public.recalculate_user_rating(NEW.rater_id);
  RETURN NEW;
END;
$$;

-- Create trigger to update ratings automatically
CREATE TRIGGER trigger_update_ratings_after_insert
  AFTER INSERT OR UPDATE OR DELETE ON public.user_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ratings_after_insert();

-- Function to get user rating summary
CREATE OR REPLACE FUNCTION public.get_user_rating_summary(user_id_param UUID)
RETURNS TABLE(
  average_rating DECIMAL(3,2),
  total_ratings INTEGER,
  rating_breakdown JSONB,
  recent_reviews JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.average_rating,
    p.total_ratings_received,
    -- Rating breakdown (1-5 stars count)
    jsonb_build_object(
      '5', COALESCE((SELECT COUNT(*) FROM public.user_ratings WHERE rated_user_id = user_id_param AND rating = 5), 0),
      '4', COALESCE((SELECT COUNT(*) FROM public.user_ratings WHERE rated_user_id = user_id_param AND rating = 4), 0),
      '3', COALESCE((SELECT COUNT(*) FROM public.user_ratings WHERE rated_user_id = user_id_param AND rating = 3), 0),
      '2', COALESCE((SELECT COUNT(*) FROM public.user_ratings WHERE rated_user_id = user_id_param AND rating = 2), 0),
      '1', COALESCE((SELECT COUNT(*) FROM public.user_ratings WHERE rated_user_id = user_id_param AND rating = 1), 0)
    ) as rating_breakdown,
    -- Recent reviews with text
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'rating', rating,
          'review_text', review_text,
          'created_at', created_at,
          'bounty_id', bounty_id,
          'rating_type', rating_type
        )
      )
      FROM public.user_ratings 
      WHERE rated_user_id = user_id_param 
        AND review_text IS NOT NULL 
        AND review_text != ''
      ORDER BY created_at DESC 
      LIMIT 5
    ), '[]'::jsonb) as recent_reviews
  FROM public.profiles p
  WHERE p.id = user_id_param;
$$;