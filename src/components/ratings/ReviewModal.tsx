import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { createRating, canUserRate, getMyRating, CreateRatingRequest } from '@/lib/api/ratings';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Star, Loader2, CheckCircle, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bountyId: string;
  onComplete?: () => void;
}

interface RatingTarget {
  userId: string;
  userName: string;
  avatarUrl?: string;
  ratingType: 'poster_to_hunter' | 'hunter_to_poster';
  roleLabel: string;
}

export function ReviewModal({ 
  open, 
  onOpenChange, 
  bountyId,
  onComplete 
}: ReviewModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [target, setTarget] = useState<RatingTarget | null>(null);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [bountyTitle, setBountyTitle] = useState('');

  useEffect(() => {
    if (open && bountyId && user) {
      loadReviewData();
    }
  }, [open, bountyId, user]);

  const loadReviewData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setRating(0);
      setReviewText('');
      setAlreadyRated(false);
      
      // Get bounty info
      const { data: bounty } = await supabase
        .from('Bounties')
        .select('id, title, poster_id')
        .eq('id', bountyId)
        .single();

      if (!bounty) {
        toast({
          title: "Bounty not found",
          description: "This bounty could not be loaded.",
          variant: "destructive",
        });
        onOpenChange(false);
        return;
      }

      setBountyTitle(bounty.title);

      // Get accepted submission to find hunter
      const { data: submission } = await supabase
        .from('Submissions')
        .select('hunter_id')
        .eq('bounty_id', bountyId)
        .eq('status', 'accepted')
        .maybeSingle();

      if (!submission) {
        toast({
          title: "No completed transaction",
          description: "This bounty hasn't been completed yet.",
          variant: "destructive",
        });
        onOpenChange(false);
        return;
      }

      const isPoster = bounty.poster_id === user.id;
      const isHunter = submission.hunter_id === user.id;

      if (!isPoster && !isHunter) {
        toast({
          title: "Cannot leave review",
          description: "You weren't involved in this bounty.",
          variant: "destructive",
        });
        onOpenChange(false);
        return;
      }

      // Determine who to rate
      const targetUserId = isPoster ? submission.hunter_id : bounty.poster_id;
      const ratingType = isPoster ? 'poster_to_hunter' : 'hunter_to_poster';

      // Check if can rate
      const canRate = await canUserRate(bountyId, targetUserId, ratingType);
      if (!canRate) {
        // Check if already rated
        const existingRating = await getMyRating(bountyId, targetUserId, ratingType);
        if (existingRating) {
          setAlreadyRated(true);
        } else {
          toast({
            title: "Cannot leave review",
            description: "You're not eligible to rate this user.",
            variant: "destructive",
          });
          onOpenChange(false);
          return;
        }
      }

      // Get target user profile
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', targetUserId)
        .single();

      setTarget({
        userId: targetUserId,
        userName: targetProfile?.username || targetProfile?.full_name || 'User',
        avatarUrl: targetProfile?.avatar_url,
        ratingType,
        roleLabel: isPoster ? 'Hunter' : 'Bounty Poster',
      });

    } catch (error) {
      console.error('Error loading review data:', error);
      toast({
        title: "Error",
        description: "Failed to load review data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !target) return;

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const ratingData: CreateRatingRequest = {
        rated_user_id: target.userId,
        bounty_id: bountyId,
        rating,
        review_text: reviewText.trim() || undefined,
        rating_type: target.ratingType,
      };

      await createRating(ratingData);
      
      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback.",
      });

      onOpenChange(false);
      onComplete?.();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : alreadyRated ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Already Reviewed
              </DialogTitle>
              <DialogDescription>
                You've already left a review for this bounty.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center text-muted-foreground">
              Your review is visible on their profile.
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : target ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Leave a Review
              </DialogTitle>
              <DialogDescription>
                How was your experience with this {target.roleLabel.toLowerCase()}?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* User being rated */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={target.avatarUrl} alt={target.userName} />
                  <AvatarFallback>{getUserInitials(target.userName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{target.userName}</p>
                  <p className="text-sm text-muted-foreground">{target.roleLabel}</p>
                </div>
              </div>

              {/* Bounty reference */}
              <div className="text-sm text-muted-foreground">
                For bounty: <span className="font-medium text-foreground">{bountyTitle}</span>
              </div>

              {/* Star Rating */}
              <div className="space-y-2">
                <Label>Your Rating</Label>
                <div className="flex items-center justify-center py-2">
                  <StarRating 
                    rating={rating}
                    onRatingChange={setRating}
                    size="lg"
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  {rating === 0 ? 'Tap to rate' : 
                   rating === 1 ? 'Poor' :
                   rating === 2 ? 'Below Average' :
                   rating === 3 ? 'Average' :
                   rating === 4 ? 'Good' : 'Excellent'}
                </p>
              </div>

              {/* Review Text */}
              <div className="space-y-2">
                <Label htmlFor="review">Written Review (Optional)</Label>
                <Textarea
                  id="review"
                  placeholder="Share details about your experience..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="min-h-24 resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {reviewText.length}/500
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="sm:mr-auto"
              >
                Maybe Later
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
              >
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Review
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
