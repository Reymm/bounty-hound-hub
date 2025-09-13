import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRating } from './StarRating';
import { getUserRatings } from '@/lib/api/ratings';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Star, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface RatingSummaryProps {
  userId: string;
  compact?: boolean;
}

interface RatingStats {
  averageRating: number;
  totalRatings: number;
  ratingBreakdown: { [key: string]: number };
  recentReviews: Array<{
    rating: number;
    review_text: string;
    created_at: string;
    bounty_id: string;
    rating_type: string;
  }>;
}

export function RatingSummary({ userId, compact = false }: RatingSummaryProps) {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRatingStats();
  }, [userId]);

  const loadRatingStats = async () => {
    try {
      setLoading(true);
      const ratings = await getUserRatings(userId);
      
      if (ratings.length === 0) {
        setStats({
          averageRating: 0,
          totalRatings: 0,
          ratingBreakdown: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
          recentReviews: []
        });
        return;
      }

      // Calculate stats
      const totalRatings = ratings.length;
      const averageRating = ratings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings;
      
      const ratingBreakdown = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
      ratings.forEach(rating => {
        ratingBreakdown[rating.rating.toString()]++;
      });

      const recentReviews = ratings
        .filter(rating => rating.review_text && rating.review_text.trim())
        .slice(0, 5)
        .map(rating => ({
          rating: rating.rating,
          review_text: rating.review_text!,
          created_at: rating.created_at,
          bounty_id: rating.bounty_id,
          rating_type: rating.rating_type
        }));

      setStats({
        averageRating,
        totalRatings,
        ratingBreakdown,
        recentReviews
      });
    } catch (error) {
      console.error('Error loading rating stats:', error);
      setStats({
        averageRating: 0,
        totalRatings: 0,
        ratingBreakdown: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
        recentReviews: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton className="h-32" />;
  }

  if (!stats) {
    return null;
  }

  if (compact) {
    if (stats.totalRatings === 0) {
      return (
        <span className="text-sm text-muted-foreground">
          No ratings yet
        </span>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <StarRating 
          rating={stats.averageRating}
          readonly
          size="sm"
        />
        <span className="text-sm font-medium">
          {stats.averageRating.toFixed(1)}
        </span>
        <span className="text-sm text-muted-foreground">
          ({stats.totalRatings} review{stats.totalRatings !== 1 ? 's' : ''})
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Only show Overall Rating card if user has ratings */}
      {stats.totalRatings > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              User Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {stats.averageRating.toFixed(1)}
                </div>
                <StarRating 
                  rating={stats.averageRating}
                  readonly
                  size="md"
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {stats.totalRatings} review{stats.totalRatings !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Rating Breakdown */}
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.ratingBreakdown[rating.toString()] || 0;
                  const percentage = stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-2 text-sm">
                      <span className="w-8">{rating}★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Reviews */}
      {stats.recentReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentReviews.map((review, index) => (
                <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <StarRating 
                      rating={review.rating}
                      readonly
                      size="sm"
                    />
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    "{review.review_text}"
                  </p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {review.rating_type === 'poster_to_hunter' ? 'As Hunter' : 'As Poster'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.totalRatings === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium text-lg mb-2">No ratings yet</h3>
            <p className="text-muted-foreground">
              This user hasn't received any ratings from completed bounties.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}