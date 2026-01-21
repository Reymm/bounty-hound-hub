import { useState } from 'react';
import { Loader2, Database, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
const DEMO_MARKER = '[DEMO]'; // Added to description to identify demo bounties

export function AdminDemoSeeder() {
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [seedDialogOpen, setSeedDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
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
      // Delete bounties that contain the demo marker in their description
      const { error, count } = await supabase
        .from('Bounties')
        .delete({ count: 'exact' })
        .eq('poster_id', ADMIN_USER_ID)
        .like('description', `%${DEMO_MARKER}%`);

      if (error) {
        throw error;
      }

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
        </div>

        <p className="text-xs text-muted-foreground">
          Demo bounties include a hidden [DEMO] marker and can be cleared without affecting real user data.
        </p>
      </CardContent>
    </Card>
  );
}
