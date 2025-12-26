import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PendingRating {
  bountyId: string;
  bountyTitle: string;
  ratedUserId: string;
  ratedUserName: string;
  ratingType: 'poster_to_hunter' | 'hunter_to_poster';
}

export function usePendingRatings() {
  const { user } = useAuth();
  const [pendingRating, setPendingRating] = useState<PendingRating | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const checkPendingRatings = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      // Check for completed bounties where user hasn't rated yet
      // As poster: find bounties I posted with accepted submissions I haven't rated
      const { data: myBounties } = await supabase
        .from('Bounties')
        .select(`
          id,
          title,
          poster_id
        `)
        .eq('poster_id', user.id)
        .in('status', ['fulfilled', 'completed']);

      if (myBounties && myBounties.length > 0) {
        for (const bounty of myBounties) {
          if (dismissed.includes(`poster_${bounty.id}`)) continue;

          // Get accepted submission for this bounty
          const { data: submission } = await supabase
            .from('Submissions')
            .select('hunter_id')
            .eq('bounty_id', bounty.id)
            .eq('status', 'accepted')
            .single();

          if (submission) {
            // Check if rating exists
            const { data: existingRating } = await supabase
              .from('user_ratings')
              .select('id')
              .eq('bounty_id', bounty.id)
              .eq('rater_id', user.id)
              .eq('rating_type', 'poster_to_hunter')
              .single();

            if (!existingRating) {
              // Get hunter name
              const { data: hunterProfile } = await supabase
                .from('profiles')
                .select('full_name, username')
                .eq('id', submission.hunter_id)
                .single();

              setPendingRating({
                bountyId: bounty.id,
                bountyTitle: bounty.title,
                ratedUserId: submission.hunter_id,
                ratedUserName: hunterProfile?.full_name || hunterProfile?.username || 'Hunter',
                ratingType: 'poster_to_hunter',
              });
              return;
            }
          }
        }
      }

      // As hunter: find bounties where my submission was accepted and I haven't rated poster
      const { data: mySubmissions } = await supabase
        .from('Submissions')
        .select(`
          bounty_id,
          hunter_id
        `)
        .eq('hunter_id', user.id)
        .eq('status', 'accepted');

      if (mySubmissions && mySubmissions.length > 0) {
        for (const submission of mySubmissions) {
          if (dismissed.includes(`hunter_${submission.bounty_id}`)) continue;

          // Get bounty details
          const { data: bounty } = await supabase
            .from('Bounties')
            .select('id, title, poster_id, status')
            .eq('id', submission.bounty_id)
            .in('status', ['fulfilled', 'completed'])
            .single();

          if (bounty) {
            // Check if rating exists
            const { data: existingRating } = await supabase
              .from('user_ratings')
              .select('id')
              .eq('bounty_id', bounty.id)
              .eq('rater_id', user.id)
              .eq('rating_type', 'hunter_to_poster')
              .single();

            if (!existingRating) {
              // Get poster name
              const { data: posterProfile } = await supabase
                .from('profiles')
                .select('full_name, username')
                .eq('id', bounty.poster_id)
                .single();

              setPendingRating({
                bountyId: bounty.id,
                bountyTitle: bounty.title,
                ratedUserId: bounty.poster_id!,
                ratedUserName: posterProfile?.full_name || posterProfile?.username || 'Poster',
                ratingType: 'hunter_to_poster',
              });
              return;
            }
          }
        }
      }

      // No pending ratings found
      setPendingRating(null);
    } catch (error) {
      console.error('Error checking pending ratings:', error);
    } finally {
      setLoading(false);
    }
  }, [user, dismissed]);

  useEffect(() => {
    if (user) {
      // Check on initial load
      checkPendingRatings();
    }
  }, [user, checkPendingRatings]);

  const dismissRating = useCallback((bountyId: string, type: 'poster' | 'hunter') => {
    const key = `${type}_${bountyId}`;
    setDismissed(prev => [...prev, key]);
    setPendingRating(null);
    // Check for more pending ratings after dismissing
    setTimeout(() => checkPendingRatings(), 100);
  }, [checkPendingRatings]);

  const onRatingComplete = useCallback(() => {
    setPendingRating(null);
    // Check for more pending ratings after completing
    setTimeout(() => checkPendingRatings(), 100);
  }, [checkPendingRatings]);

  return {
    pendingRating,
    loading,
    dismissRating,
    onRatingComplete,
    refreshPendingRatings: checkPendingRatings,
  };
}
