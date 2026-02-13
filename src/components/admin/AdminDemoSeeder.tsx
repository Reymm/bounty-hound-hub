import { useState } from 'react';
import { Loader2, Database, Trash2, AlertTriangle, RefreshCw, Users, Trophy, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ALL_DEMO_BOUNTIES, DemoBounty } from '@/lib/demo-bounties-data';

const ADMIN_USER_ID = '8f050746-36d4-4ac7-99d8-a2419e09cc55';
const DEMO_MARKER = '[DEMO]';

export function AdminDemoSeeder() {
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [resettingStripe, setResettingStripe] = useState(false);
  const [seedingUsers, setSeedingUsers] = useState(false);
  const [seedingStories, setSeedingStories] = useState(false);
  const [clearingStories, setClearingStories] = useState(false);
  const [assigningAvatars, setAssigningAvatars] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState('');
  const [progress, setProgress] = useState(0);
  const [seedDialogOpen, setSeedDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [stripeResetDialogOpen, setStripeResetDialogOpen] = useState(false);
  const [seedUsersDialogOpen, setSeedUsersDialogOpen] = useState(false);


  const { toast } = useToast();

  const createBounty = async (bounty: DemoBounty): Promise<boolean> => {
    try {
      const now = new Date();
      const createdAt = new Date(now.getTime() - bounty.days_ago * 24 * 60 * 60 * 1000);
      const deadline = new Date(now.getTime() + bounty.deadline_days * 24 * 60 * 60 * 1000);

      const { error } = await supabase.from('Bounties').insert({
        title: bounty.title,
        description: `${bounty.description} ${DEMO_MARKER}`,
        category: bounty.category,
        subcategory: bounty.subcategory,
        amount: bounty.amount,
        location: bounty.location,
        tags: bounty.tags,
        images: bounty.images,
        verification_requirements: bounty.verification_requirements,
        poster_id: ADMIN_USER_ID,
        status: 'open',
        escrow_status: 'funded',
        escrow_amount: bounty.amount,
        deadline: deadline.toISOString(),
        created_at: createdAt.toISOString(),
        view_count: bounty.view_count
      });

      if (error) {
        console.error('Error creating bounty:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Exception creating bounty:', error);
      return false;
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setProgress(0);
    setSeedDialogOpen(false);

    let successCount = 0;
    const total = ALL_DEMO_BOUNTIES.length;

    // Process in batches of 3 for reliability
    const batchSize = 3;
    for (let i = 0; i < total; i += batchSize) {
      const batch = ALL_DEMO_BOUNTIES.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(createBounty));
      successCount += results.filter(Boolean).length;
      setProgress(Math.round(((i + batch.length) / total) * 100));
    }

    setSeeding(false);
    setProgress(0);

    if (successCount === total) {
      toast({
        title: "Demo bounties created! 🎉",
        description: `Successfully created ${successCount} demo bounties. Your marketplace is ready to show off!`,
      });
    } else {
      toast({
        title: "Partial success",
        description: `Created ${successCount}/${total} bounties. Some may have failed.`,
        variant: "destructive",
      });
    }
  };

  const handleClear = async () => {
    setClearing(true);
    setClearDialogOpen(false);

    try {
      const { error, count } = await supabase
        .from('Bounties')
        .delete({ count: 'exact' })
        .eq('poster_id', ADMIN_USER_ID)
        .like('description', `%${DEMO_MARKER}%`);

      if (error) throw error;

      toast({
        title: "Demo bounties cleared",
        description: `Removed ${count || 0} demo bounties from the platform.`,
      });
    } catch (error) {
      console.error('Error clearing demo bounties:', error);
      toast({
        title: "Error",
        description: "Failed to clear demo bounties. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setClearing(false);
    }
  };

  const handleSeedUsers = async () => {
    setSeedingUsers(true);
    setSeedUsersDialogOpen(false);

    try {
      const { data, error } = await supabase.functions.invoke('seed-users', {
        body: { action: 'create_users' }
      });

      if (error) throw error;

      toast({
        title: "Users seeded! 🎉",
        description: `Created ${data.created} accounts, skipped ${data.skipped} existing. ${data.errors ? `${data.errors.length} errors.` : ''}`,
      });
    } catch (error: any) {
      console.error('Error seeding users:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to seed users.",
        variant: "destructive",
      });
    } finally {
      setSeedingUsers(false);
    }
  };

  const handleSeedStories = async () => {
    setSeedingStories(true);
    

    try {
      const { data, error } = await supabase.functions.invoke('seed-success-stories', {
        body: { action: 'create_stories', site_url: window.location.origin }
      });

      if (error) throw error;

      toast({
        title: "Success stories created! 🎉",
        description: `Created ${data.created}/${data.total} completed bounties with ratings. ${data.errors ? `${data.errors.length} errors.` : ''}`,
      });
    } catch (error: any) {
      console.error('Error seeding stories:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to seed success stories.",
        variant: "destructive",
      });
    } finally {
      setSeedingStories(false);
    }
  };

  const handleClearStories = async () => {
    setClearingStories(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-success-stories', {
        body: { action: 'clear_stories' }
      });
      if (error) throw error;
      toast({
        title: "Stories cleared",
        description: `Deleted ${data.deleted} seeded bounties, submissions, and ratings.`,
      });
    } catch (error: any) {
      console.error('Error clearing stories:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to clear stories.",
        variant: "destructive",
      });
    } finally {
      setClearingStories(false);
    }
  };

  const handleAssignAvatars = async () => {
    setAssigningAvatars(true);
    

    try {
      const { data, error } = await supabase.functions.invoke('seed-success-stories', {
        body: { action: 'assign_avatars' }
      });

      if (error) throw error;

      toast({
        title: "Avatars assigned! 🎉",
        description: `Updated ${data.updated} profiles with unique avatar photos.`,
      });
    } catch (error: any) {
      console.error('Error assigning avatars:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign avatars.",
        variant: "destructive",
      });
    } finally {
      setAssigningAvatars(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <Database className="h-5 w-5" />
          Developer Tools
        </CardTitle>
        <CardDescription>
          Seed the platform with demo bounties for testing and showcasing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(seeding || clearing) && (
          <div className="space-y-2">
            <Progress value={seeding ? progress : 50} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {seeding ? `Creating bounties... ${progress}%` : 'Clearing demo data...'}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <AlertDialog open={seedDialogOpen} onOpenChange={setSeedDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="default" 
                disabled={seeding || clearing}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {seeding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Seed {ALL_DEMO_BOUNTIES.length} Demo Bounties
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Create Demo Bounties?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>This will create <strong>{ALL_DEMO_BOUNTIES.length} realistic demo bounties</strong> for showcasing the platform:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>1 Hero Bounty:</strong> Emotional blanket search ($500)</li>
                    <li><strong>8 Reconnections:</strong> Family & friend searches ($50-$200)</li>
                    <li><strong>6 Classic Cars:</strong> Vintage vehicle hunts ($125-$250)</li>
                    <li><strong>14 Collectibles:</strong> Cards, watches, vintage items ($50-$250)</li>
                  </ul>
                  <p className="text-amber-600 font-medium">All bounties will be posted by your admin account.</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSeed} className="bg-amber-600 hover:bg-amber-700">
                  Create Demo Bounties
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                disabled={seeding || clearing}
                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                {clearing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Demo Bounties
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Clear All Demo Bounties?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all demo bounties (those with the [DEMO] marker). 
                  Real user bounties will not be affected. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleClear}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Demo Bounties
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Stripe Connect Reset Tool */}
          <AlertDialog open={stripeResetDialogOpen} onOpenChange={setStripeResetDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                disabled={seeding || clearing || resettingStripe}
                className="border-purple-300 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
              >
                {resettingStripe ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Stripe Connect
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-purple-600">
                  <RefreshCw className="h-5 w-5" />
                  Reset Stripe Connect Account
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>This will delete a stuck Stripe Connect account and clear the user's profile so they can restart onboarding.</p>
                  <div className="space-y-2">
                    <Label htmlFor="stripe-account-id">Stripe Account ID</Label>
                    <Input
                      id="stripe-account-id"
                      placeholder="acct_1SsDKwHL39ipwmc6"
                      value={stripeAccountId}
                      onChange={(e) => setStripeAccountId(e.target.value)}
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setStripeAccountId('')}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={async () => {
                    if (!stripeAccountId.trim()) {
                      toast({
                        title: "Error",
                        description: "Please enter a Stripe Account ID",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    setResettingStripe(true);
                    setStripeResetDialogOpen(false);
                    
                    try {
                      const { data, error } = await supabase.functions.invoke('delete-connect-account', {
                        body: { stripe_account_id: stripeAccountId.trim() }
                      });
                      
                      if (error) throw error;
                      
                      toast({
                        title: "Stripe Connect Reset! ✓",
                        description: `Deleted ${stripeAccountId} and cleared user profile. They can now restart onboarding.`,
                      });
                      setStripeAccountId('');
                    } catch (error: any) {
                      console.error('Error resetting Stripe Connect:', error);
                      toast({
                        title: "Error",
                        description: error.message || "Failed to reset Stripe Connect account",
                        variant: "destructive",
                      });
                    } finally {
                      setResettingStripe(false);
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={!stripeAccountId.trim()}
                >
                  Delete & Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {/* Seed Users Tool */}
          <AlertDialog open={seedUsersDialogOpen} onOpenChange={setSeedUsersDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                disabled={seeding || clearing || resettingStripe || seedingUsers}
                className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {seedingUsers ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Users...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Seed 67 User Accounts
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-emerald-600">
                  <Users className="h-5 w-5" />
                  Create 67 Seed Accounts?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>This will create <strong>67 unique user accounts</strong> (test4 through test70) using kaylaannrey+testN@gmail.com with realistic profiles.</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Each account has a unique username, bio, and region</li>
                    <li>All use the same password: <code className="bg-muted px-1 rounded">BountyBay2025!</code></li>
                    <li>Existing accounts will be skipped</li>
                    <li>You can log into any account to post real bounties</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleSeedUsers}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Create Accounts
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Seed Success Stories */}
          <Button 
            variant="outline" 
            disabled={seedingStories}
            onClick={handleSeedStories}
            className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
          >
            {seedingStories ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating Stories...</>
            ) : (
              <><Trophy className="h-4 w-4 mr-2" />Seed 15 Success Stories</>
            )}
          </Button>

          {/* Clear Success Stories */}
          <Button 
            variant="outline" 
            disabled={clearingStories}
            onClick={handleClearStories}
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            {clearingStories ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Clearing Stories...</>
            ) : (
              <><Trash2 className="h-4 w-4 mr-2" />Clear All Stories</>
            )}
          </Button>

          {/* Assign Avatars */}
          <Button 
            variant="outline" 
            disabled={assigningAvatars}
            onClick={handleAssignAvatars}
            className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
          >
            {assigningAvatars ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Assigning...</>
            ) : (
              <><UserCircle className="h-4 w-4 mr-2" />Assign Avatars</>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Demo bounties include a hidden [DEMO] marker and can be cleared without affecting real user data.
        </p>
      </CardContent>
    </Card>
  );
}
