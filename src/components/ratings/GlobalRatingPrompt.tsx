import { usePendingRatings } from '@/hooks/use-pending-ratings';
import { RatingPromptDialog } from './RatingPromptDialog';

export function GlobalRatingPrompt() {
  const { pendingRating, dismissRating, onRatingComplete } = usePendingRatings();

  if (!pendingRating) return null;

  const type = pendingRating.ratingType === 'poster_to_hunter' ? 'poster' : 'hunter';

  return (
    <RatingPromptDialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          dismissRating(pendingRating.bountyId, type);
        }
      }}
      bountyId={pendingRating.bountyId}
      ratedUserId={pendingRating.ratedUserId}
      ratedUserName={pendingRating.ratedUserName}
      ratingType={pendingRating.ratingType}
      onComplete={onRatingComplete}
    />
  );
}
