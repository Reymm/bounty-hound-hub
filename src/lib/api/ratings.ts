import { supabase } from '@/integrations/supabase/client';

export interface CreateRatingRequest {
  rated_user_id: string;
  bounty_id: string;
  rating: number; // 1-5 stars
  review_text?: string;
  rating_type: 'poster_to_hunter' | 'hunter_to_poster';
}

export interface UserRating {
  id: string;
  rater_id: string;
  rated_user_id: string;
  bounty_id: string;
  rating: number;
  review_text?: string;
  rating_type: string;
  created_at: string;
  updated_at: string;
}

export interface RatingSummary {
  average_rating: number;
  total_ratings: number;
  rating_breakdown: {
    [key: string]: number; // '1': count, '2': count, etc.
  };
  recent_reviews: Array<{
    rating: number;
    review_text: string;
    created_at: string;
    bounty_id: string;
    rating_type: string;
  }>;
}

export const createRating = async (data: CreateRatingRequest): Promise<UserRating> => {
  const { data: rating, error } = await supabase
    .from('user_ratings')
    .insert({
      rater_id: (await supabase.auth.getUser()).data.user?.id!,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;

  // Recalculate the rated user's average rating
  await supabase.rpc('recalculate_user_rating', { user_id_param: data.rated_user_id });

  return rating;
};

export const updateRating = async (
  ratingId: string, 
  updates: { rating?: number; review_text?: string }
): Promise<UserRating> => {
  const { data: rating, error } = await supabase
    .from('user_ratings')
    .update(updates)
    .eq('id', ratingId)
    .select()
    .single();

  if (error) throw error;

  // Recalculate the rated user's average rating if the rating value changed
  if (updates.rating !== undefined && rating) {
    await supabase.rpc('recalculate_user_rating', { user_id_param: rating.rated_user_id });
  }

  return rating;
};

export const getUserRatings = async (userId: string): Promise<UserRating[]> => {
  const { data, error } = await supabase
    .from('user_ratings')
    .select('*')
    .eq('rated_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getBountyRatings = async (bountyId: string): Promise<UserRating[]> => {
  const { data, error } = await supabase
    .from('user_ratings')
    .select('*')
    .eq('bounty_id', bountyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getMyRating = async (
  bountyId: string, 
  ratedUserId: string, 
  ratingType: string
): Promise<UserRating | null> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;

  const { data, error } = await supabase
    .from('user_ratings')
    .select('*')
    .eq('bounty_id', bountyId)
    .eq('rated_user_id', ratedUserId)
    .eq('rater_id', user.user.id)
    .eq('rating_type', ratingType)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const canUserRate = async (
  bountyId: string, 
  ratedUserId: string, 
  ratingType: 'poster_to_hunter' | 'hunter_to_poster'
): Promise<boolean> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;

  // Check if bounty is completed and user is involved
  const { data: bountyData, error: bountyError } = await supabase
    .from('Bounties')
    .select(`
      id,
      poster_id,
      status,
      Submissions!Submissions_bounty_id_fkey!inner(
        hunter_id,
        status
      )
    `)
    .eq('id', bountyId)
    .eq('Submissions.status', 'accepted')
    .single();

  if (bountyError || !bountyData) return false;

  // Check if user can rate based on their role
  if (ratingType === 'poster_to_hunter') {
    return bountyData.poster_id === user.user.id && 
           bountyData.Submissions.some((s: any) => s.hunter_id === ratedUserId);
  } else {
    return bountyData.Submissions.some((s: any) => s.hunter_id === user.user.id) && 
           bountyData.poster_id === ratedUserId;
  }
};