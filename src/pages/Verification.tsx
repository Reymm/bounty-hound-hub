import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CreditCard, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { CountrySelectDialog } from '@/components/profile/CountrySelectDialog';
import { Profile as ProfileType } from '@/lib/types';
import { supabaseApi } from '@/lib/api/supabase';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Verification() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [countryDialogOpen, setCountryDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadProfile();
  }, [user]);

  const syncStripeConnectStatus = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase.functions.invoke('check-connect-status', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (error) {
        console.error('Error syncing Stripe Connect status:', error);
      }
    } catch (error) {
      console.error('Error syncing Stripe Connect status:', error);
    }
  };

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Sync Stripe Connect status in background
      syncStripeConnectStatus().then(() => {
        supabaseApi.getProfile(user.id).then(updatedProfile => {
          if (updatedProfile) {
            setProfile(updatedProfile);
          }
        });
      });
      
      const profileData = await supabaseApi.getProfile(user.id);
      setProfile(profileData);
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

  const handleVerifyIdentity = async () => {
    try {
      setActionLoading(true);
      const { data, error } = await supabase.functions.invoke('create-identity-session');
      if (error) throw error;
      if (data?.already_verified) {
        toast({ title: "Already Verified", description: "Your identity is verified." });
        loadProfile();
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetupPayout = async () => {
    if (profile?.hasPayoutMethod) {
      try {
        setActionLoading(true);
        const result = await supabaseApi.createConnectAccount();
        
        if (!result) throw new Error('Failed to get Connect account link');
        
        if (result.onboarding_url) {
          // Use window.location.href for mobile compatibility (popups get blocked)
          window.location.href = result.onboarding_url;
        } else {
          throw new Error('No onboarding URL received');
        }
      } catch (error: any) {
        console.error('Error opening Stripe:', error);
        toast({
          title: "Error opening Stripe",
          description: error instanceof Error ? error.message : "Please try again later.",
          variant: "destructive",
        });
        setActionLoading(false);
      }
    } else {
      setCountryDialogOpen(true);
    }
  };

  const handleCountrySelected = async (country: string) => {
    try {
      setActionLoading(true);
      
      const result = await supabaseApi.createConnectAccount(country);
      
      if (!result) throw new Error('Failed to create Connect account');
      
      if (result.onboarding_url) {
        setCountryDialogOpen(false);
        // Use window.location.href for mobile compatibility
        window.location.href = result.onboarding_url;
      } else {
        throw new Error('No onboarding URL received');
      }
      
    } catch (error: any) {
      console.error('Error setting up payout:', error);
      toast({
        title: "Error setting up payout",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSkeleton className="h-8 w-64 mb-4" />
        <LoadingSkeleton className="h-4 w-96 mb-8" />
        <div className="space-y-6">
          <LoadingSkeleton className="h-48" />
          <LoadingSkeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
          <p className="text-muted-foreground">Unable to load your profile.</p>
        </div>
      </div>
    );
  }

  const isFullyVerified = profile.identityVerified && profile.stripeConnectPayoutsEnabled;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-24 scroll-mt-20">
      {/* Header - Compact for mobile */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Hunter Verification</h1>
          <p className="text-xs text-muted-foreground">Complete to claim bounties</p>
        </div>
      </div>

      {/* Success State */}
      {isFullyVerified && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">You're All Set!</h3>
                <p className="text-sm text-green-700">Ready to claim bounties.</p>
              </div>
              <Button onClick={() => navigate('/bounties')} size="sm" className="w-full sm:w-auto">
                Browse Bounties
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Identity Verification */}
      <Card className={`mb-6 ${profile.identityVerified ? 'border-green-200' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${
              profile.identityVerified 
                ? 'bg-green-100 text-green-700' 
                : 'bg-primary text-primary-foreground'
            }`}>
              {profile.identityVerified ? <CheckCircle2 className="h-5 w-5" /> : '1'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base sm:text-lg">Verify Your Identity</CardTitle>
                {profile.identityVerified ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Complete</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Required</Badge>
                )}
              </div>
              <CardDescription className="text-xs sm:text-sm mt-1">Photo ID via Stripe Identity</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {profile.identityVerified ? (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Your identity has been verified</span>
            </div>
          ) : (
            <>
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <h4 className="font-medium mb-2 text-sm">What you'll need:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• A valid government-issued photo ID</li>
                  <li>• Good lighting for a clear photo</li>
                  <li>• Takes about 2-3 minutes to complete</li>
                </ul>
              </div>
              <Button 
                onClick={handleVerifyIdentity}
                disabled={actionLoading}
                className="w-full"
                size="lg"
              >
                <User className="mr-2 h-5 w-5" />
                {actionLoading ? 'Opening...' : 'Start Identity Verification'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Payout Setup */}
      <Card className={profile.stripeConnectPayoutsEnabled ? 'border-green-200' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${
              profile.stripeConnectPayoutsEnabled 
                ? 'bg-green-100 text-green-700' 
                : profile.identityVerified
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
            }`}>
              {profile.stripeConnectPayoutsEnabled ? <CheckCircle2 className="h-5 w-5" /> : '2'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base sm:text-lg">Set Up Payouts</CardTitle>
                {profile.stripeConnectPayoutsEnabled ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Complete</Badge>
                ) : profile.hasPayoutMethod ? (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 text-xs">Pending</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Required</Badge>
                )}
              </div>
              <CardDescription className="text-xs sm:text-sm mt-1">Link bank account via Stripe</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {profile.stripeConnectPayoutsEnabled ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Your payout method is set up and verified</span>
              </div>
              <Button 
                variant="outline"
                onClick={handleSetupPayout}
                disabled={actionLoading}
                className="w-full"
              >
                Manage Payout Settings
              </Button>
            </div>
          ) : profile.hasPayoutMethod ? (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-medium text-amber-800 text-sm">Setup Incomplete</h4>
                    <p className="text-xs text-amber-700 mt-1">
                      Log in to Stripe to finish your payout setup.
                    </p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleSetupPayout}
                disabled={actionLoading}
                className="w-full"
                size="lg"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                {actionLoading ? 'Opening...' : 'Continue Setup'}
              </Button>
            </>
          ) : (
            <>
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <h4 className="font-medium mb-2 text-sm">What you'll need:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Bank account or debit card details</li>
                  <li>• Your SSN/SIN for tax purposes</li>
                  <li>• Takes about 5 minutes to complete</li>
                </ul>
              </div>
              <Button 
                onClick={handleSetupPayout}
                disabled={actionLoading || !profile.identityVerified}
                className="w-full"
                size="lg"
                variant={profile.identityVerified ? 'default' : 'secondary'}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                {actionLoading ? 'Opening...' : 'Set Up Payout Method'}
              </Button>
              {!profile.identityVerified && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Complete Step 1 first to unlock this step
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Questions? Visit our <a href="/faq" className="text-primary hover:underline">FAQ</a> or{' '}
          <a href="/support" className="text-primary hover:underline">contact support</a>
        </p>
      </div>

      <CountrySelectDialog
        open={countryDialogOpen}
        onOpenChange={setCountryDialogOpen}
        onConfirm={handleCountrySelected}
        loading={actionLoading}
      />
    </div>
  );
}
