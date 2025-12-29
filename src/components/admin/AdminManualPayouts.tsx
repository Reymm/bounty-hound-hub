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
  Mail,
  MapPin,
  AlertTriangle,
  ShieldAlert,
  ShieldOff
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
  accepted_at: string;
  payout_eligible_at: string;
  is_eligible_for_payout: boolean;
  // New security fields
  capture_status: string;
  payout_freeze: boolean;
  payout_freeze_reason: string | null;
  dispute_opened: boolean;
}

export function AdminManualPayouts() {
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<PendingPayout | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [payoutAmountSent, setPayoutAmountSent] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadPendingPayouts();
  }, []);

  const loadPendingPayouts = async () => {
    try {
      setLoading(true);
      
      // Fetch escrow transactions with manual payout pending
      // Include new security fields
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
          updated_at,
          capture_status,
          payout_freeze,
          payout_freeze_reason,
          eligible_at
        `)
        .eq('payout_method', 'manual')
        .eq('manual_payout_status', 'pending')
        .eq('capture_status', 'captured') // Only show captured payments
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
        // Now use accepted_at instead of updated_at
        const { data: submission } = await supabase
          .from('Submissions')
          .select('hunter_id, accepted_at, updated_at, dispute_opened')
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

          // Use eligible_at from DB if available, otherwise calculate from accepted_at
          const acceptedAt = new Date(submission.accepted_at || submission.updated_at);
          const payoutEligibleAt = payout.eligible_at 
            ? new Date(payout.eligible_at) 
            : addDays(acceptedAt, 7);
          
          // HARD ENFORCEMENT: Check all conditions
          const isEligibleForPayout = 
            isPast(payoutEligibleAt) && 
            !payout.payout_freeze && 
            !submission.dispute_opened &&
            payout.capture_status === 'captured';

          payoutsWithDetails.push({
            ...payout,
            bounty_title: bounty?.title || 'Unknown Bounty',
            hunter_name: hunter?.username || hunter?.full_name || 'Unknown',
            hunter_id: submission.hunter_id,
            hunter_payout_email: payout.hunter_payout_email || hunter?.payout_email || null,
            hunter_country: payout.hunter_country || hunter?.payout_country || null,
            accepted_at: submission.accepted_at || submission.updated_at,
            payout_eligible_at: payoutEligibleAt.toISOString(),
            is_eligible_for_payout: isEligibleForPayout,
            capture_status: payout.capture_status || 'not_captured',
            payout_freeze: payout.payout_freeze || false,
            payout_freeze_reason: payout.payout_freeze_reason || null,
            dispute_opened: submission.dispute_opened || false
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

    // HARD ENFORCEMENT: Double-check eligibility before marking as paid
    if (!selectedPayout.is_eligible_for_payout) {
      toast({
        title: 'Payout Blocked',
        description: 'This payout is not eligible. It may be frozen, disputed, or still in 7-day hold.',
        variant: 'destructive'
      });
      return;
    }

    if (selectedPayout.payout_freeze) {
      toast({
        title: 'Payout Frozen',
        description: `Cannot pay: ${selectedPayout.payout_freeze_reason || 'Payout is frozen'}`,
        variant: 'destructive'
      });
      return;
    }

    if (selectedPayout.dispute_opened) {
      toast({
        title: 'Dispute Active',
        description: 'Cannot pay while a dispute is open on this submission.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setMarkingPaid(selectedPayout.id);

      // Double-check in database before updating
      const { data: currentEscrow, error: checkError } = await supabase
        .from('escrow_transactions')
        .select('payout_freeze, manual_payout_status, capture_status')
        .eq('id', selectedPayout.id)
        .maybeSingle();

      if (checkError || !currentEscrow) {
        throw new Error('Could not verify payout status');
      }

      if (currentEscrow.payout_freeze) {
        throw new Error('Payout has been frozen since you opened this dialog');
      }

      if (currentEscrow.manual_payout_status !== 'pending') {
        throw new Error('Payout status has changed since you opened this dialog');
      }

      if (currentEscrow.capture_status !== 'captured') {
        throw new Error('Payment has not been captured yet');
      }

      // Get current user for audit trail
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const sentAmount = parseFloat(payoutAmountSent) || calculatePayoutAmount(selectedPayout);

      const { error } = await supabase
        .from('escrow_transactions')
        .update({
          manual_payout_status: 'sent',
          manual_payout_sent_at: new Date().toISOString(),
          manual_payout_reference: paymentReference.trim(),
          payout_sent_by_admin_user_id: user.id,
          payout_sent_amount: sentAmount
        })
        .eq('id', selectedPayout.id)
        .eq('payout_freeze', false) // Extra safety: only update if not frozen
        .eq('capture_status', 'captured'); // Extra safety: only update if captured

      if (error) throw error;

      toast({
        title: 'Payout Marked as Sent',
        description: `Payment of $${sentAmount.toFixed(2)} to ${selectedPayout.hunter_name} has been recorded.`
      });

      setSelectedPayout(null);
      setPaymentReference('');
      setPayoutAmountSent('');
      loadPendingPayouts();
    } catch (error: any) {
      console.error('Error marking payout:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update payout status',
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

  const getPayoutStatusBadge = (payout: PendingPayout) => {
    if (payout.payout_freeze) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <ShieldAlert className="h-3 w-3" />
          FROZEN
        </Badge>
      );
    }
    if (payout.dispute_opened) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <ShieldOff className="h-3 w-3" />
          DISPUTED
        </Badge>
      );
    }
    if (payout.is_eligible_for_payout) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Ready for Payout
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
        <AlertTriangle className="h-3 w-3 mr-1" />
        7-Day Hold
      </Badge>
    );
  };

  const getCardClass = (payout: PendingPayout) => {
    if (payout.payout_freeze || payout.dispute_opened) {
      return "border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20";
    }
    if (payout.is_eligible_for_payout) {
      return "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20";
    }
    return "border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20";
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
            Hunters require manual payout via PayPal. 7-day hold applies. Frozen/disputed payouts are blocked.
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
                <Card key={payout.id} className={getCardClass(payout)}>
                  <CardContent className="pt-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getPayoutStatusBadge(payout)}
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {payout.hunter_country || 'Unknown'}
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

                        {/* Show freeze reason */}
                        {payout.payout_freeze && payout.payout_freeze_reason && (
                          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                            ⛔ Freeze reason: {payout.payout_freeze_reason}
                          </p>
                        )}

                        {/* Show dispute warning */}
                        {payout.dispute_opened && (
                          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                            ⚠️ Active dispute - payout blocked until resolved
                          </p>
                        )}

                        {/* Show hold countdown */}
                        {!payout.is_eligible_for_payout && !payout.payout_freeze && !payout.dispute_opened && (
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
                          disabled={
                            markingPaid === payout.id || 
                            !payout.is_eligible_for_payout ||
                            payout.payout_freeze ||
                            payout.dispute_opened
                          }
                          variant={payout.is_eligible_for_payout ? "default" : "outline"}
                        >
                          {payout.payout_freeze ? 'Frozen' : 
                           payout.dispute_opened ? 'Disputed' :
                           payout.is_eligible_for_payout ? 'Mark as Paid' : 'On Hold'}
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
                <p><strong>Expected Amount:</strong> <span className="text-green-600 font-bold">${calculatePayoutAmount(selectedPayout).toFixed(2)} USD</span></p>
                <p><strong>Bounty:</strong> {selectedPayout.bounty_title}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount Sent (USD) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder={calculatePayoutAmount(selectedPayout).toFixed(2)}
                  value={payoutAmountSent}
                  onChange={(e) => setPayoutAmountSent(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the exact amount you sent via PayPal.
                </p>
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
                  Enter the transaction ID from PayPal or other payment method used.
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
              disabled={markingPaid === selectedPayout?.id || !paymentReference.trim() || !payoutAmountSent.trim()}
            >
              {markingPaid ? 'Saving...' : 'Confirm Payment Sent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
