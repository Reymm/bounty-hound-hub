import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RatingDialog } from './RatingDialog';
import { RatingPromptDialog } from './RatingPromptDialog';
import { StarRating } from './StarRating';
import { getMyRating, getBountyRatings, canUserRate, UserRating } from '@/lib/api/ratings';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Star, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface BountyRatingSectionProps {
  bountyId: string;
  posterId: string;
  posterName: string;
  bountyStatus: string;
}

export function BountyRatingSection({ 
  bountyId, 
  posterId, 
  posterName, 
  bountyStatus 
}: BountyRatingSectionProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hunterInfo, setHunterInfo] = useState<{id: string, name: string} | null>(null);
  const [canRateHunter, setCanRateHunter] = useState(false);
  const [canRatePoster, setCanRatePoster] = useState(false);
  const [myRatingToHunter, setMyRatingToHunter] = useState<UserRating | null>(null);
  const [myRatingToPoster, setMyRatingToPoster] = useState<UserRating | null>(null);
  const [allRatings, setAllRatings] = useState<UserRating[]>([]);
  const [showHunterRatingPrompt, setShowHunterRatingPrompt] = useState(false);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  useEffect(() => {
    if (user && (bountyStatus === 'fulfilled' || bountyStatus === 'completed')) {
      loadRatingData();
    }
  }, [user, bountyId, bountyStatus]);

  const loadRatingData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // First get the accepted submission to find hunter info
      const { data: submissions } = await supabase
        .from('Submissions')
        .select('hunter_id')
        .eq('bounty_id', bountyId)
        .eq('status', 'accepted')
        .limit(1);

      if (!submissions || submissions.length === 0) {
        setLoading(false);
        return;
      }

      const hunterId = submissions[0].hunter_id;
      
      // Get hunter profile info
      const { data: hunterProfile } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .eq('id', hunterId)
        .single();

      const hunterName = hunterProfile?.username || 'Hunter';
      setHunterInfo({ id: hunterId, name: hunterName });
      
      const [
        canRateHunterResult,
        canRatePosterResult,
        myHunterRating,
        myPosterRating,
        bountyRatings
      ] = await Promise.all([
        canUserRate(bountyId, hunterId, 'poster_to_hunter'),
        canUserRate(bountyId, posterId, 'hunter_to_poster'),
        getMyRating(bountyId, hunterId, 'poster_to_hunter'),
        getMyRating(bountyId, posterId, 'hunter_to_poster'),
        getBountyRatings(bountyId)
      ]);

      setCanRateHunter(canRateHunterResult);
      setCanRatePoster(canRatePosterResult);
      setMyRatingToHunter(myHunterRating);
      setMyRatingToPoster(myPosterRating);
      setAllRatings(bountyRatings);
      
      // Auto-prompt hunter to rate poster if they haven't rated yet
      if (canRatePosterResult && !myPosterRating && !hasShownPrompt) {
        setTimeout(() => {
          setShowHunterRatingPrompt(true);
          setHasShownPrompt(true);
        }, 500);
      }
    } catch (error) {
      console.error('Error loading rating data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Only show if bounty is completed/fulfilled
  if (bountyStatus !== 'completed' && bountyStatus !== 'fulfilled') {
    return null;
  }

  if (loading) {
    return <LoadingSkeleton className="h-48" />;
  }

  const showRatingSection = canRateHunter || canRatePoster || allRatings.length > 0;

  if (!showRatingSection) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Bounty Ratings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rating Actions */}
        <div className="flex flex-wrap gap-3">
          {canRateHunter && hunterInfo && (
            <RatingDialog
              bountyId={bountyId}
              ratedUserId={hunterInfo.id}
              ratedUserName={hunterInfo.name}
              ratingType="poster_to_hunter"
              existingRating={myRatingToHunter}
              onRatingSubmitted={loadRatingData}
            >
              <Button variant="outline" size="sm">
                <Star className="w-4 h-4 mr-1" />
                {myRatingToHunter ? 'Update Hunter Rating' : 'Rate Hunter'}
              </Button>
            </RatingDialog>
          )}

          {canRatePoster && (
            <RatingDialog
              bountyId={bountyId}
              ratedUserId={posterId}
              ratedUserName={posterName}
              ratingType="hunter_to_poster"
              existingRating={myRatingToPoster}
              onRatingSubmitted={loadRatingData}
            >
              <Button variant="outline" size="sm">
                <Star className="w-4 h-4 mr-1" />
                {myRatingToPoster ? 'Update Poster Rating' : 'Rate Poster'}
              </Button>
            </RatingDialog>
          )}
        </div>

        {/* Existing Ratings Display */}
        {allRatings.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Ratings for this bounty
            </h4>
            
            {allRatings.map((rating) => (
              <div key={rating.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StarRating 
                      rating={rating.rating}
                      readonly
                      size="sm"
                    />
                    <Badge variant="outline">
                      {rating.rating_type === 'poster_to_hunter' ? 'Hunter Rating' : 'Poster Rating'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(rating.created_at), 'MMM dd, yyyy')}
                  </div>
                </div>
                
                {rating.review_text && (
                  <p className="text-sm text-muted-foreground">
                    "{rating.review_text}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* My ratings display */}
        {(myRatingToHunter || myRatingToPoster) && (
          <div className="pt-3 border-t">
            <h4 className="font-medium text-sm mb-2">Your Ratings</h4>
            <div className="space-y-2">
              {myRatingToHunter && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Hunter: </span>
                  <StarRating rating={myRatingToHunter.rating} readonly size="sm" />
                </div>
              )}
              {myRatingToPoster && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Poster: </span>
                  <StarRating rating={myRatingToPoster.rating} readonly size="sm" />
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Hunter Rating Prompt Dialog */}
      <RatingPromptDialog
        open={showHunterRatingPrompt}
        onOpenChange={setShowHunterRatingPrompt}
        bountyId={bountyId}
        ratedUserId={posterId}
        ratedUserName={posterName}
        ratingType="hunter_to_poster"
        onComplete={() => {
          loadRatingData();
        }}
      />
    </Card>
  );
}
