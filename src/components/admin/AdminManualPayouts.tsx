import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  DollarSign, 
  User, 
  Clock, 
  CheckCircle2,
  ExternalLink,
  Mail,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { format, addDays, isPast, formatDistanceToNow } from 'date-fns';

interface PendingPayout {
  id: string;
  bounty_id: string;
  amount: number;
  platform_fee_amount: number;
  hunter_payout_email: string | null;
  hunter_country: string | null;
  created_at: string;
  updated_at: string;
  bounty_title: string;
  hunter_name: string;
  hunter_id: string;
  accepted_at: string; // When the submission was accepted
  payout_eligible_at: string; // 7 days after acceptance
  is_eligible_for_payout: boolean;
}

export function AdminManualPayouts() {
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<PendingPayout | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadPendingPayouts();
  }, []);

  const loadPendingPayouts = async () => {
    try {
      setLoading(true);
      
      // Fetch escrow transactions with manual payout pending
      const { data, error } = await supabase
        .from('escrow_transactions')
        .select(`
          id,
          bounty_id,
          amount,
          platform_fee_amount,
          hunter_payout_email,
          hunter_country,
          created_at,
          updated_at
        `)
        .eq('payout_method', 'manual')
        .eq('manual_payout_status', 'pending')
        .order('updated_at', { ascending: true });

      if (error) throw error;

      // Fetch bounty titles and hunter info
      const payoutsWithDetails: PendingPayout[] = [];
      
      for (const payout of data || []) {
        // Get bounty details
        const { data: bounty } = await supabase
          .from('Bounties')
          .select('title, poster_id')
          .eq('id', payout.bounty_id)
          .maybeSingle();

        // Get accepted submission to find hunter and acceptance time
        const { data: submission } = await supabase
          .from('Submissions')
          .select('hunter_id, updated_at')
          .eq('bounty_id', payout.bounty_id)
          .eq('status', 'accepted')
          .maybeSingle();

        if (submission) {
          // Get hunter profile
          const { data: hunter } = await supabase
            .from('profiles')
            .select('username, full_name, payout_email, payout_country')
            .eq('id', submission.hunter_id)
            .maybeSingle();

          // Calculate 7-day hold period
          const acceptedAt = new Date(submission.updated_at);
          const payoutEligibleAt = addDays(acceptedAt, 7);
          const isEligibleForPayout = isPast(payoutEligibleAt);

          payoutsWithDetails.push({
            ...payout,
            bounty_title: bounty?.title || 'Unknown Bounty',
            hunter_name: hunter?.username || hunter?.full_name || 'Unknown',
            hunter_id: submission.hunter_id,
            hunter_payout_email: payout.hunter_payout_email || hunter?.payout_email || null,
            hunter_country: payout.hunter_country || hunter?.payout_country || null,
            accepted_at: submission.updated_at,
            payout_eligible_at: payoutEligibleAt.toISOString(),
            is_eligible_for_payout: isEligibleForPayout
          });
        }
      }

      setPendingPayouts(payoutsWithDetails);
    } catch (error) {
      console.error('Error loading pending payouts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending payouts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedPayout || !paymentReference.trim()) {
      toast({
        title: 'Reference Required',
        description: 'Please enter a payment reference (PayPal transaction ID, Wise reference, etc.)',
        variant: 'destructive'
      });
      return;
    }

    try {
      setMarkingPaid(selectedPayout.id);

      const { error } = await supabase
        .from('escrow_transactions')
        .update({
          manual_payout_status: 'sent',
          manual_payout_sent_at: new Date().toISOString(),
          manual_payout_reference: paymentReference.trim()
        })
        .eq('id', selectedPayout.id);

      if (error) throw error;

      toast({
        title: 'Payout Marked as Sent',
        description: `Payment to ${selectedPayout.hunter_name} has been recorded.`
      });

      setSelectedPayout(null);
      setPaymentReference('');
      loadPendingPayouts();
    } catch (error) {
      console.error('Error marking payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payout status',
        variant: 'destructive'
      });
    } finally {
      setMarkingPaid(null);
    }
  };

  const calculatePayoutAmount = (payout: PendingPayout) => {
    // $2 + 5% platform fee
    const platformFee = payout.platform_fee_amount || (2 + payout.amount * 0.05);
    return payout.amount - platformFee;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Manual Payouts Pending
          </CardTitle>
          <CardDescription>
            US hunters require manual payout via PayPal or Wise. Send payment, then mark as paid.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingPayouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No pending manual payouts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayouts.map((payout) => (
                <Card 
                  key={payout.id} 
                  className={payout.is_eligible_for_payout 
                    ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20"
                    : "border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20"
                  }
                >
                  <CardContent className="pt-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {payout.is_eligible_for_payout ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Ready for Payout
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              7-Day Hold
                            </Badge>
                          )}
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {payout.hunter_country || 'US'}
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium">{payout.bounty_title}</h4>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {payout.hunter_name}
                          </span>
                          {payout.hunter_payout_email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {payout.hunter_payout_email}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Accepted {format(new Date(payout.accepted_at), 'MMM d, yyyy')}
                          </span>
                        </div>

                        {!payout.is_eligible_for_payout && (
                          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                            Payout eligible {formatDistanceToNow(new Date(payout.payout_eligible_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            ${calculatePayoutAmount(payout).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            (${payout.amount.toFixed(2)} - $2 + 5% fee)
                          </p>
                        </div>

                        <Button
                          onClick={() => setSelectedPayout(payout)}
                          disabled={markingPaid === payout.id || !payout.is_eligible_for_payout}
                          variant={payout.is_eligible_for_payout ? "default" : "outline"}
                        >
                          {payout.is_eligible_for_payout ? 'Mark as Paid' : 'On Hold'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mark as Paid Dialog */}
      <Dialog open={!!selectedPayout} onOpenChange={() => setSelectedPayout(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Manual Payment</DialogTitle>
            <DialogDescription>
              Enter the payment reference after sending funds to the hunter.
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p><strong>Hunter:</strong> {selectedPayout.hunter_name}</p>
                <p><strong>PayPal/Email:</strong> {selectedPayout.hunter_payout_email || 'Not provided'}</p>
                <p><strong>Amount to Send:</strong> <span className="text-green-600 font-bold">${calculatePayoutAmount(selectedPayout).toFixed(2)} USD</span></p>
                <p><strong>Bounty:</strong> {selectedPayout.bounty_title}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Payment Reference *</Label>
                <Input
                  id="reference"
                  placeholder="PayPal Transaction ID, Wise Reference, etc."
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the transaction ID from PayPal, Wise, or other payment method used.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPayout(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleMarkAsPaid}
              disabled={markingPaid === selectedPayout?.id || !paymentReference.trim()}
            >
              {markingPaid ? 'Saving...' : 'Confirm Payment Sent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
