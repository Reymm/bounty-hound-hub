import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  User, 
  Star, 
  MapPin,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { ActivityHistory } from '@/components/profile/ActivityHistory';
import { LocationPicker } from '@/components/ui/location-picker';
import { RatingSummary } from '@/components/ratings/RatingSummary';
import { ReferralCard } from '@/components/referral/ReferralCard';
import { profileUpdateSchema, ProfileUpdateFormData } from '@/lib/validators';
import { Profile as ProfileType } from '@/lib/types';
import { supabaseApi } from '@/lib/api/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Profile() {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema)
  });

  const regionValue = watch('region');

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const profileData = await supabaseApi.getProfile(user.id);
      setProfile(profileData);
      
      if (profileData) {
        reset({
          username: profileData.username || '',
          bio: profileData.bio || '',
          region: profileData.region
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error loading profile",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProfileUpdateFormData) => {
    if (!profile || !user) return;

    try {
      setUpdating(true);
      
      const updateData = {
        bio: data.bio,
        region: data.region,
        ...(profile.username ? {} : { username: data.username })
      };
      
      const updatedProfile = await supabaseApi.updateProfile(user.id, updateData);
      
      if (updatedProfile) {
        setProfile(updatedProfile);
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarChange = async (url: string | null) => {
    if (!profile || !user) return;

    try {
      const updatedProfile = await supabaseApi.updateProfile(user.id, { avatarUrl: url });
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast({
        title: "Error updating avatar",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSkeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <LoadingSkeleton className="h-64" />
            <LoadingSkeleton className="h-48" />
          </div>
          <LoadingSkeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
          <p className="text-muted-foreground">Unable to load your profile. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your public profile information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center">
                  <AvatarUpload
                    currentAvatarUrl={profile.avatarUrl}
                    fallbackText={profile.username?.charAt(0) || 'U'}
                    onAvatarChange={handleAvatarChange}
                    disabled={updating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Choose your username"
                    {...register('username')}
                    disabled={!!profile.username}
                    className={`${errors.username ? 'border-destructive' : ''} ${profile.username ? 'bg-muted cursor-not-allowed' : ''}`}
                  />
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {profile.username 
                      ? "Your username cannot be changed" 
                      : "Choose your unique username (cannot be changed later)"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell others about yourself..."
                    rows={3}
                    {...register('bio')}
                    className={errors.bio ? 'border-destructive' : ''}
                  />
                  {errors.bio && (
                    <p className="text-sm text-destructive">{errors.bio.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <LocationPicker
                    value={regionValue || ''}
                    onChange={(location) => setValue('region', location, { shouldDirty: true })}
                    placeholder="Search for your city or region..."
                    className={errors.region ? '[&_input]:border-destructive' : ''}
                  />
                  {errors.region && (
                    <p className="text-sm text-destructive">{errors.region.message}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={!isDirty || updating}
                  >
                    {updating ? 'Updating...' : 'Update Profile'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Ratings Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Ratings & Reviews
            </h2>
            <RatingSummary userId={profile.id} />
          </div>

          {/* Activity Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Activity History</h2>
            <ActivityHistory userId={profile.id} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Avatar className="w-16 h-16 mx-auto mb-3">
                  {profile.avatarUrl ? (
                    <AvatarImage src={profile.avatarUrl} alt="Profile picture" />
                  ) : null}
                  <AvatarFallback className="text-2xl">
                    {profile.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">@{profile.username || 'username'}</h3>
                {profile.bio && (
                  <p className="text-sm text-muted-foreground mt-2 italic">"{profile.bio}"</p>
                )}
                {profile.region && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {profile.region}
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rating</span>
                  <div className="flex items-center gap-1">
                    {profile.total_ratings_received > 0 ? (
                      <>
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-medium">
                          {profile.average_rating.toFixed(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({profile.total_ratings_received})
                        </span>
                      </>
                    ) : (
                      <span className="font-medium text-muted-foreground">No ratings yet</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="font-medium">{profile.completedBounties} bounties</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Posted</span>
                  <span className="font-medium">{profile.postedBounties} bounties</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(profile.joinedAt, 'MMM yyyy')}
                  </span>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Referral Program */}
          <ReferralCard />
        </div>
      </div>
    </div>
  );
}
