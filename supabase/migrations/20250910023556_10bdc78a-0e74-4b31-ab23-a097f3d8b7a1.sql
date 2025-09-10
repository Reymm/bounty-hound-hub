-- Fix search path security issue for rating functions
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