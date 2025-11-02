import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  User, 
  Star, 
  MapPin, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { RatingSummary } from '@/components/ratings/RatingSummary';
import { Profile as ProfileType, IdvStatus } from '@/lib/types';
import { supabaseApi } from '@/lib/api/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  const loadProfile = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const profileData = await supabaseApi.getProfile(userId);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Profile not found",
        description: "This user profile could not be loaded.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This user profile doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Back Button */}
      <Button asChild variant="ghost" size="sm">
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
      </Button>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
              <AvatarFallback className="text-2xl">
                {getUserInitials(profile.displayName)}
              </AvatarFallback>
            </Avatar>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{profile.displayName}</h1>
                  {profile.idvStatus === IdvStatus.VERIFIED && (
                    <Badge variant="default" className="gap-1">
                      <Shield className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
                {profile.username && (
                  <p className="text-muted-foreground">@{profile.username}</p>
                )}
              </div>

              {profile.bio && (
                <p className="text-foreground leading-relaxed">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {profile.region && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.region}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {format(new Date(profile.joinedAt), 'MMMM yyyy')}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reputation</p>
                <p className="text-2xl font-bold">{profile.reputationScore.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500 fill-current" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Successful Claims</p>
                <p className="text-2xl font-bold">{profile.totalSuccessfulClaims}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">{profile.average_rating.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ratings Summary - Always show, even for new users */}
      <RatingSummary userId={profile.id} />

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Ratings Given</p>
              <p className="font-semibold">{profile.total_ratings_given}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Ratings Received</p>
              <p className="font-semibold">{profile.total_ratings_received}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Failed Claims</p>
              <p className="font-semibold">{profile.totalFailedClaims}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Member Since</p>
              <p className="font-semibold">{format(new Date(profile.joinedAt), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
