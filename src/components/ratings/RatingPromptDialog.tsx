import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from './StarRating';
import { createRating } from '@/lib/api/ratings';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star } from 'lucide-react';

interface RatingPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bountyId: string;
  ratedUserId: string;
  ratedUserName: string;
  ratingType: 'poster_to_hunter' | 'hunter_to_poster';
  onComplete?: () => void;
}

export function RatingPromptDialog({
  open,
  onOpenChange,
  bountyId,
  ratedUserId,
  ratedUserName,
  ratingType,
  onComplete,
}: RatingPromptDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const isHunterRating = ratingType === 'hunter_to_poster';
  const roleText = isHunterRating ? 'bounty poster' : 'hunter';

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setRating(0);
      setReviewText('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await createRating({
        rated_user_id: ratedUserId,
        bounty_id: bountyId,
        rating,
        review_text: reviewText.trim() || undefined,
        rating_type: ratingType,
      });

      toast({
        title: "Rating submitted!",
        description: "Thank you for your feedback.",
      });

      onOpenChange(false);
      onComplete?.();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Error",
        description: "Failed to submit rating. You can rate later from the bounty page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    toast({
      title: "Review saved for later",
      description: "You can leave your review anytime from My Bounties → Reviews tab.",
    });
    onComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Rate Your Experience
          </DialogTitle>
          <DialogDescription>
            How was your experience working with {ratedUserName} as the {roleText}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex items-center justify-center py-2">
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size="lg"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Click on the stars to rate from 1 to 5
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review">Review (Optional)</Label>
            <Textarea
              id="review"
              placeholder="Share your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="min-h-20"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {reviewText.length}/500
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={handleSkip} disabled={loading}>
            Leave Review Later
          </Button>
          <Button onClick={handleSubmit} disabled={loading || rating === 0}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Rating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
