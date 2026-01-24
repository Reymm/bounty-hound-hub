import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ConnectedAccounts } from '@/components/profile/ConnectedAccounts';
import { Profile as ProfileType } from '@/lib/types';
import { supabaseApi } from '@/lib/api/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Settings() {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const profileData = await supabaseApi.getProfile(user.id);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error loading settings",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      
      // TODO: Implement account deletion
      console.log('TODO: Implement account deletion');
      
      toast({
        title: "Account deletion requested",
        description: "This feature is coming soon.",
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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSkeleton className="h-8 w-48 mb-4" />
        <LoadingSkeleton className="h-4 w-64 mb-8" />
        <div className="space-y-6">
          <LoadingSkeleton className="h-32" />
          <LoadingSkeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and connected services
        </p>
      </div>

      {/* Connected Accounts */}
      {user && <ConnectedAccounts user={user} />}

      {/* Account Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile?.isSuspended ? (
            <div className="space-y-2">
              <Badge variant="destructive">Account Suspended</Badge>
              {profile.suspendedUntil && (
                <p className="text-sm text-muted-foreground">
                  Suspended until: {format(profile.suspendedUntil, 'PPP')}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
              <span className="text-sm text-muted-foreground">Your account is in good standing</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <div className="mb-4">
              <h4 className="font-medium text-foreground mb-1">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Once you delete your account, there is no going back. All your data will be permanently removed.
              </p>
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
        </CardContent>
      </Card>
    </div>
  );
}
