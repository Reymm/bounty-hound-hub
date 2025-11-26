import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, ExternalLink, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

interface DisputedSubmission {
  id: string;
  bounty_id: string;
  hunter_id: string;
  message: string;
  dispute_reason: string;
  dispute_opened_at: string;
  proof_urls: string[];
  Bounties: {
    title: string;
    poster_id: string;
    amount: number;
  };
}

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState<DisputedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<DisputedSubmission | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Submissions')
        .select('*, Bounties!bounty_id(title, poster_id, amount)')
        .eq('dispute_opened', true)
        .order('dispute_opened_at', { ascending: false });

      if (error) throw error;
      setDisputes(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading disputes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (submissionId: string, resolution: 'accept' | 'reject') => {
    try {
      const dispute = disputes.find(d => d.id === submissionId);
      if (!dispute) return;

      // Update submission status
      const { error: updateError } = await supabase
        .from('Submissions')
        .update({
          status: resolution === 'accept' ? 'accepted' : 'rejected',
          dispute_opened: false,
          rejection_reason: resolution === 'reject' ? resolutionNotes : null
        })
        .eq('id', submissionId);

      if (updateError) throw updateError;

      // Update bounty status if accepting
      if (resolution === 'accept') {
        await supabase
          .from('Bounties')
          .update({ status: 'completed' })
          .eq('id', dispute.bounty_id);

        // Process payout
        await supabase.functions.invoke('process-payout', {
          body: { submissionId }
        });
      }

      // Send notification emails to both parties
      const { data: hunterAuth } = await supabase.auth.admin.getUserById(dispute.hunter_id);
      const { data: posterAuth } = await supabase.auth.admin.getUserById((dispute.Bounties as any).poster_id);

      if (hunterAuth?.user) {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'dispute_resolved',
            recipientEmail: hunterAuth.user.email!,
            recipientName: hunterAuth.user.email?.split('@')[0] || 'Hunter',
            bountyTitle: (dispute.Bounties as any).title,
            bountyId: dispute.bounty_id,
            resolution: resolution,
            resolutionNotes: resolutionNotes || undefined
          }
        });
      }

      if (posterAuth?.user) {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'dispute_resolved',
            recipientEmail: posterAuth.user.email!,
            recipientName: posterAuth.user.email?.split('@')[0] || 'Poster',
            bountyTitle: (dispute.Bounties as any).title,
            bountyId: dispute.bounty_id,
            resolution: resolution,
            resolutionNotes: resolutionNotes || undefined
          }
        });
      }

      toast({
        title: "Dispute resolved",
        description: `Submission ${resolution === 'accept' ? 'accepted and payout processed' : 'rejected'}.`,
      });

      setSelectedDispute(null);
      setResolutionNotes('');
      loadDisputes();
    } catch (error: any) {
      toast({
        title: "Error resolving dispute",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <LoadingSkeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/admin/support')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          Disputed Submissions
        </h1>
        <p className="text-muted-foreground mt-2">
          Review and resolve submission disputes
        </p>
      </div>

      {disputes.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="No active disputes"
          description="All submissions are running smoothly!"
        />
      ) : (
        <div className="grid gap-6">
          {disputes.map((dispute) => (
            <Card key={dispute.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {(dispute.Bounties as any).title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Bounty Amount: ${(dispute.Bounties as any).amount}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Disputed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Dispute Reason:</Label>
                  <Alert>
                    <AlertDescription>{dispute.dispute_reason}</AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Hunter's Submission:</Label>
                  <p className="text-sm">{dispute.message}</p>
                </div>

                {dispute.proof_urls && dispute.proof_urls.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Proof URLs:</Label>
                    <div className="space-y-1">
                      {dispute.proof_urls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Opened {formatDistanceToNow(new Date(dispute.dispute_opened_at), { addSuffix: true })}
                </div>

                {selectedDispute?.id === dispute.id ? (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="resolutionNotes">Resolution Notes (Optional)</Label>
                      <Textarea
                        id="resolutionNotes"
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Add notes about your decision..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDispute(null);
                          setResolutionNotes('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveDispute(dispute.id, 'accept')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Submission
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveDispute(dispute.id, 'reject')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Submission
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setSelectedDispute(dispute)}
                    >
                      Resolve Dispute
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/b/${dispute.bounty_id}`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Bounty
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
