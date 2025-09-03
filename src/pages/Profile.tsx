import { useState, useEffect } from 'react';
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
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { profileUpdateSchema, ProfileUpdateFormData } from '@/lib/validators';
import { Profile as ProfileType, IdvStatus } from '@/lib/types';
import { supabaseApi } from '@/lib/api/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Profile() {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
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

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const profileData = await supabaseApi.getProfile(user.id);
      setProfile(profileData);
      
      if (profileData) {
        reset({
          displayName: profileData.displayName,
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
      
      // TODO: Replace with actual Stripe Identity verification
      console.log('TODO: Start Stripe Identity verification');
      
      toast({
        title: "Verification started",
        description: "TODO: This will redirect to Stripe Identity verification.",
      });
      
    } catch (error) {
      console.error('Error starting verification:', error);
      toast({
        title: "Error starting verification",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleSetupPayout = async () => {
    try {
      // TODO: Replace with actual Stripe Connect setup
      console.log('TODO: Setup Stripe Connect Express account');
      
      toast({
        title: "Payout setup started",
        description: "TODO: This will redirect to Stripe Connect onboarding.",
      });
      
    } catch (error) {
      console.error('Error setting up payout:', error);
      toast({
        title: "Error setting up payout",
        description: "Please try again later.",
        variant: "destructive",
      });
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and verification status
        </p>
      </div>

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
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                      Required to message bounty posters and submit claims
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
                    <li>• Message bounty posters directly</li>
                    <li>• Submit claims and earn bounties</li>
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
                    size="sm"
                    variant={profile.hasPayoutMethod ? "outline" : "default"}
                    className={!profile.hasPayoutMethod ? "bg-primary hover:bg-primary-hover text-primary-foreground" : ""}
                  >
                    {profile.hasPayoutMethod ? 'Manage' : 'Set Up Payout'}
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Payout Information</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Payments processed via Stripe</li>
                  <li>• Funds released when bounty poster approves</li>
                  <li>• Platform fee: 5% of bounty amount</li>
                  <li>• Payouts typically arrive in 2-7 business days</li>
                </ul>
              </div>
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
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-3">
                  {profile.displayName.charAt(0)}
                </div>
                <h3 className="font-semibold text-lg">{profile.displayName}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-medium">
                      {profile.rating > 0 ? profile.rating.toFixed(1) : 'No ratings'}
                    </span>
                    {profile.ratingCount > 0 && (
                      <span className="text-sm text-muted-foreground">
                        ({profile.ratingCount})
                      </span>
                    )}
                  </div>
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

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" disabled>
                <Calendar className="h-4 w-4 mr-2" />
                View Activity History
              </Button>
              
              <Button variant="outline" className="w-full justify-start" disabled>
                <Star className="h-4 w-4 mr-2" />
                Ratings & Reviews
              </Button>
              
              <Separator className="my-3" />
              
              <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" disabled>
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}