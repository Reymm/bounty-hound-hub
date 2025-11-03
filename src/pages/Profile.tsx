import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  User, 
  Shield, 
  CreditCard, 
  Star, 
  MapPin, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  Settings,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { ActivityHistory } from '@/components/profile/ActivityHistory';
import { RatingSummary } from '@/components/ratings/RatingSummary';
import { profileUpdateSchema, ProfileUpdateFormData } from '@/lib/validators';
import { Profile as ProfileType, IdvStatus } from '@/lib/types';
import { supabaseApi } from '@/lib/api/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema)
  });

  useEffect(() => {
    loadProfile();
  }, []);

  // Handle scroll restoration when navigating back
  useEffect(() => {
    if (history.scrollRestoration) {
      history.scrollRestoration = 'manual';
    }
    
    const savedScrollPosition = sessionStorage.getItem('profile_scroll_position');
    if (savedScrollPosition && !loading) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPosition));
        sessionStorage.removeItem('profile_scroll_position');
      }, 100);
    }
    
    return () => {
      if (history.scrollRestoration) {
        history.scrollRestoration = 'auto';
      }
    };
  }, [loading]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const profileData = await supabaseApi.getProfile(user.id);
      setProfile(profileData);
      
      if (profileData) {
        reset({
          displayName: profileData.displayName,
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
    if (!profile) return;

    try {
      setUpdating(true);
      
      const updatedProfile = await supabaseApi.updateProfile(user.id, data);
      
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

  const handleStartVerification = async () => {
    try {
      setVerificationLoading(true);
      
      const result = await supabaseApi.createKycVerification();
      
      if (!result) throw new Error('Failed to create verification session');
      
      if (result.verification_url) {
        // Save scroll position before navigating
        sessionStorage.setItem('profile_scroll_position', window.scrollY.toString());
        // Redirect to Stripe Identity verification
        window.location.href = result.verification_url;
      } else {
        throw new Error('No verification URL received');
      }
      
    } catch (error) {
      console.error('Error starting verification:', error);
      toast({
        title: "Error starting verification",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
      setVerificationLoading(false);
    }
  };

  const handleSetupPayout = async () => {
    try {
      setPayoutLoading(true);
      
      const result = await supabaseApi.createConnectAccount();
      
      if (!result) throw new Error('Failed to create Connect account');
      
      if (result.onboarding_url) {
        // Try to open in new tab
        const newWindow = window.open(result.onboarding_url, '_blank', 'noopener,noreferrer');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          // Popup was blocked, create a clickable link instead
          const linkContainer = document.createElement('div');
          linkContainer.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 10px 40px rgba(0,0,0,0.2); 
                        z-index: 9999; max-width: 500px; text-align: center;">
              <h3 style="margin-bottom: 1rem; font-size: 1.25rem; font-weight: 600;">Complete Payout Setup</h3>
              <p style="margin-bottom: 1.5rem; color: #666;">Please click the button below to complete your Stripe Connect setup:</p>
              <a href="${result.onboarding_url}" target="_blank" rel="noopener noreferrer"
                 style="display: inline-block; background: #635BFF; color: white; padding: 0.75rem 2rem; 
                        border-radius: 0.375rem; text-decoration: none; font-weight: 500;">
                Open Stripe Connect
              </a>
              <button onclick="this.parentElement.remove()" 
                      style="display: block; margin: 1rem auto 0; background: transparent; border: none; 
                             color: #666; cursor: pointer; text-decoration: underline;">
                Close
              </button>
            </div>
          `;
          document.body.appendChild(linkContainer);
        } else {
          toast({
            title: "Opening Stripe Connect",
            description: "Complete your payout setup in the new tab, then return here.",
          });
        }

        setPayoutLoading(false);
      } else {
        throw new Error('No onboarding URL received');
      }
      
    } catch (error) {
      console.error('Error setting up payout:', error);
      toast({
        title: "Error setting up payout",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
      setPayoutLoading(false);
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

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      
      // TODO: Implement account deletion
      console.log('TODO: Implement account deletion');
      
      toast({
        title: "Account deletion requested",
        description: "TODO: This will process account deletion.",
      });
      
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error deleting account",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getIdvStatusIcon = (status: IdvStatus) => {
    switch (status) {
      case IdvStatus.VERIFIED:
        return <CheckCircle className="h-4 w-4 text-success" />;
      case IdvStatus.PENDING:
        return <Clock className="h-4 w-4 text-warning" />;
      case IdvStatus.FAILED:
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getIdvStatusBadge = (status: IdvStatus) => {
    switch (status) {
      case IdvStatus.VERIFIED:
        return <Badge className="status-active">Verified</Badge>;
      case IdvStatus.PENDING:
        return <Badge className="status-pending">Pending</Badge>;
      case IdvStatus.FAILED:
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Not Verified</Badge>;
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and verification status
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="ratings">Ratings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Profile */}
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
                        fallbackText={profile.displayName.charAt(0)}
                        onAvatarChange={handleAvatarChange}
                        disabled={updating}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          placeholder="Your display name"
                          {...register('displayName')}
                          className={errors.displayName ? 'border-destructive' : ''}
                        />
                        {errors.displayName && (
                          <p className="text-sm text-destructive">{errors.displayName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          placeholder="Optional username"
                          {...register('username')}
                          className={errors.username ? 'border-destructive' : ''}
                        />
                        {errors.username && (
                          <p className="text-sm text-destructive">{errors.username.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          This will be your unique identifier on the platform
                        </p>
                      </div>
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
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="region"
                          placeholder="Your city or region"
                          className={`pl-10 ${errors.region ? 'border-destructive' : ''}`}
                          {...register('region')}
                        />
                      </div>
                      {errors.region && (
                        <p className="text-sm text-destructive">{errors.region.message}</p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={!isDirty || updating}
                        className="bg-primary hover:bg-primary-hover text-primary-foreground"
                      >
                        {updating ? 'Updating...' : 'Update Profile'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
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
                        {profile.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg">{profile.displayName}</h3>
                    {profile.username && (
                      <p className="text-sm text-muted-foreground">@{profile.username}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    {profile.bio && (
                      <p className="text-sm text-muted-foreground mt-2 italic">"{profile.bio}"</p>
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
                      <span className="text-sm text-muted-foreground">Reputation</span>
                      {profile.total_ratings_received > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="font-medium">{profile.reputationScore.toFixed(1)}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="font-medium text-muted-foreground">Not rated yet</span>
                          <span className="text-xs text-muted-foreground">Earn ⭐ by completing bounties</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Completed Bounties</span>
                      <span className="font-medium">{profile.completedBounties}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Posted Bounties</span>
                      <span className="font-medium">{profile.postedBounties}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Member Since</span>
                      <span className="font-medium">
                        {format(profile.joinedAt, 'MMM yyyy')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ratings" className="space-y-6">
          <RatingSummary userId={profile.id} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <ActivityHistory userId={profile.id} />
        </TabsContent>

        <TabsContent value="verification" className="space-y-6">
          {/* Identity Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Identity Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  {getIdvStatusIcon(profile.idvStatus)}
                  <div>
                    <p className="font-medium">Identity Verification</p>
                    <p className="text-sm text-muted-foreground">
                      Required for bounties over $500
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getIdvStatusBadge(profile.idvStatus)}
                  {profile.idvStatus === IdvStatus.NOT_VERIFIED && (
                    <Button 
                      onClick={handleStartVerification}
                      disabled={verificationLoading}
                      size="sm"
                      className="bg-primary hover:bg-primary-hover text-primary-foreground"
                    >
                      {verificationLoading ? 'Starting...' : 'Verify Identity'}
                    </Button>
                  )}
                </div>
              </div>

              {profile.idvStatus === IdvStatus.NOT_VERIFIED && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Why verify your identity?</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Submit claims on high-value bounties (over $500)</li>
                    <li>• Build trust with the community</li>
                    <li>• Access premium features</li>
                  </ul>
                </div>
              )}

              {profile.idvStatus === IdvStatus.PENDING && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <p className="text-sm text-warning-foreground">
                    Your identity verification is being processed. This usually takes 1-2 business days.
                  </p>
                </div>
              )}

              {profile.idvStatus === IdvStatus.FAILED && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm text-destructive mb-2">
                    Identity verification failed. Please try again or contact support.
                  </p>
                  <Button 
                    onClick={handleStartVerification}
                    disabled={verificationLoading}
                    size="sm"
                    variant="outline"
                  >
                    {verificationLoading ? 'Starting...' : 'Retry Verification'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payout Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payout Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium">Bank Account / Debit Card</p>
                  <p className="text-sm text-muted-foreground">
                    Set up how you want to receive bounty payments
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {profile.hasPayoutMethod ? (
                    <Badge className="status-active">Connected</Badge>
                  ) : (
                    <Badge variant="secondary">Not Set Up</Badge>
                  )}
                  <Button 
                    onClick={handleSetupPayout}
                    disabled={payoutLoading}
                    size="sm"
                    variant={profile.hasPayoutMethod ? "outline" : "default"}
                    className={!profile.hasPayoutMethod ? "bg-primary hover:bg-primary-hover text-primary-foreground" : ""}
                  >
                    {payoutLoading ? 'Opening...' : (profile.hasPayoutMethod ? 'Manage' : 'Set Up Payout')}
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Payout Information</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Payments processed via Stripe</li>
                  <li>• Funds released when bounty poster approves</li>
                  <li>• Platform fee: 2.3% deducted from payout</li>
                  <li>• Payouts typically arrive in 2-7 business days</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-2">Account Status</h4>
                  {profile.isSuspended ? (
                    <div className="space-y-2">
                      <Badge variant="destructive">Account Suspended</Badge>
                      {profile.suspendedUntil && (
                        <p className="text-sm text-muted-foreground">
                          Suspended until: {format(profile.suspendedUntil, 'PPP')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Badge className="bg-success-light text-success">Active</Badge>
                  )}
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Manage your email and push notification preferences
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Privacy Settings</h4>
                      <p className="text-sm text-muted-foreground">
                        Control who can see your profile and activity
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      <Shield className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-destructive mb-2">Danger Zone</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Once you delete your account, there is no going back. All your data will be permanently removed.
                      </p>
                    </div>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={deleting}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deleting ? 'Deleting...' : 'Delete Account'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data from our servers, including:
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Your profile information</li>
                            <li>All bounties you've posted</li>
                            <li>Your claim history</li>
                            <li>Messages and conversations</li>
                            <li>Ratings and reviews</li>
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, delete my account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}