import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Loader2 } from 'lucide-react';
import { StarRating } from './StarRating';
import { createRating, updateRating, CreateRatingRequest } from '@/lib/api/ratings';
import { useToast } from '@/hooks/use-toast';

interface RatingDialogProps {
  bountyId: string;
  ratedUserId: string;
  ratedUserName: string;
  ratingType: 'poster_to_hunter' | 'hunter_to_poster';
  existingRating?: {
    id: string;
    rating: number;
    review_text?: string;
  } | null;
  children?: React.ReactNode;
  onRatingSubmitted?: () => void;
}

export function RatingDialog({ 
  bountyId,
  ratedUserId, 
  ratedUserName, 
  ratingType,
  existingRating,
  children,
  onRatingSubmitted
}: RatingDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [reviewText, setReviewText] = useState(existingRating?.review_text || '');

  const isHunterRating = ratingType === 'hunter_to_poster';
  const roleText = isHunterRating ? 'bounty poster' : 'hunter';

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit a rating.",
        variant: "destructive",
      });
      return;
    }

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
      if (existingRating) {
        // Update existing rating
        await updateRating(existingRating.id, {
          rating,
          review_text: reviewText.trim() || undefined,
        });
        
        toast({
          title: "Rating updated",
          description: "Your rating has been updated successfully.",
        });
      } else {
        // Create new rating
        const ratingData: CreateRatingRequest = {
          rated_user_id: ratedUserId,
          bounty_id: bountyId,
          rating,
          review_text: reviewText.trim() || undefined,
          rating_type: ratingType,
        };

        await createRating(ratingData);
        
        toast({
          title: "Rating submitted",
          description: "Thank you for your feedback!",
        });
      }

      setOpen(false);
      onRatingSubmitted?.();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Star className="w-4 h-4 mr-1" />
            {existingRating ? 'Update Rating' : 'Rate User'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingRating ? 'Update Rating' : 'Rate User'}
          </DialogTitle>
          <DialogDescription>
            Rate your experience working with {ratedUserName} as the {roleText} on this bounty.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex items-center gap-2">
              <StarRating 
                rating={rating}
                onRatingChange={setRating}
                size="lg"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Click on the stars to rate from 1 to 5
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review">Review (Optional)</Label>
            <Textarea
              id="review"
              placeholder="Share your experience working with this user..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="min-h-20"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {reviewText.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="w-full sm:w-auto"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {existingRating ? 'Update Rating' : 'Submit Rating'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}