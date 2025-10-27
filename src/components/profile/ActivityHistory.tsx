import { useState, useEffect } from 'react';
import { Activity as ActivityIcon, DollarSign, Star, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Activity } from '@/lib/types';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface ActivityHistoryProps {
  userId: string;
}

export function ActivityHistory({ userId }: ActivityHistoryProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivityHistory();
  }, [userId]);

  const loadActivityHistory = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual API call to fetch real user activity
      // const activities = await supabaseApi.getUserActivity(userId);
      
      // For now, show empty state - no mock data
      setActivities([]);
    } catch (error) {
      console.error('Error loading activity history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'bounty_posted':
        return <DollarSign className="h-4 w-4 text-primary" />;
      case 'claim_submitted':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'claim_accepted':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'claim_rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'rating_received':
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return <ActivityIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityBadge = (type: Activity['type']) => {
    switch (type) {
      case 'bounty_posted':
        return <Badge variant="secondary">Posted</Badge>;
      case 'claim_submitted':
        return <Badge className="bg-warning-light text-warning">Submitted</Badge>;
      case 'claim_accepted':
        return <Badge className="bg-success-light text-success">Accepted</Badge>;
      case 'claim_rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'rating_received':
        return <Badge className="bg-yellow-100 text-yellow-800">Rated</Badge>;
      default:
        return <Badge variant="outline">Activity</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <LoadingSkeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <LoadingSkeleton className="h-4 w-3/4" />
                <LoadingSkeleton className="h-3 w-1/2" />
              </div>
              <LoadingSkeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ActivityIcon className="h-5 w-5" />
          Activity History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <ActivityIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 border border-border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{activity.title}</h4>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      
                      {activity.bountyTitle && (
                        <Link 
                          to={`/bounty/${activity.bountyId}`}
                          className="text-sm text-primary hover:underline block mt-1"
                        >
                          {activity.bountyTitle}
                        </Link>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {activity.amount && (
                        <span className="text-sm font-medium text-success">
                          ${activity.amount}
                        </span>
                      )}
                      {activity.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{activity.rating}</span>
                        </div>
                      )}
                      {getActivityBadge(activity.type)}
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(activity.createdAt, 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}