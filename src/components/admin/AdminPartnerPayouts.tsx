import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatUSD } from '@/components/ui/currency-display';
import { DollarSign, Send, Check, Clock, AlertCircle, Loader2, Plus, TrendingUp, Wallet, Users } from 'lucide-react';
import { format } from 'date-fns';

interface Partner {
  id: string;
  username: string | null;
  full_name: string | null;
  partner_name: string | null;
  partner_commission_percent: number | null;
  partner_flat_fee_cents: number | null;
  referral_code: string | null;
  payout_email: string | null;
}

interface PartnerEarnings {
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  bounties_count: number;
  last_payout_at: string | null;
}

interface Payout {
  id: string;
  partner_id: string;
  amount: number;
  payment_method: string;
  payment_reference: string | null;
  payout_email: string | null;
  status: string;
  notes: string | null;
  period_start: string | null;
  period_end: string | null;
  bounties_count: number;
  created_at: string;
  sent_at: string | null;
  partner?: Partner;
}

interface PayoutFormData {
  partner_id: string;
  amount: string;
  payment_method: string;
  payout_email: string;
  notes: string;
}

interface PlatformRevenue {
  totalPlatformFees: number;
  totalBounties: number;
  totalOwedToPartners: number;
  totalPaidToPartners: number;
  netRevenue: number;
}

interface CompletedBountyFee {
  bountyId: string;
  bountyTitle: string;
  bountyAmount: number;
  platformFee: number;
  capturedAt: string;
  partnerName: string | null;
  partnerEarning: number;
}

export function AdminPartnerPayouts() {
  const [partners, setPartners] = useState<(Partner & { earnings?: PartnerEarnings })[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [revenue, setRevenue] = useState<PlatformRevenue | null>(null);
  const [bountyFees, setBountyFees] = useState<CompletedBountyFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<(Partner & { earnings?: PartnerEarnings }) | null>(null);
  const [formData, setFormData] = useState<PayoutFormData>({
    partner_id: '',
    amount: '',
    payment_method: 'paypal',
    payout_email: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load partners
      const { data: partnersData, error: partnersError } = await supabase
        .from('profiles')
        .select('id, username, full_name, partner_name, partner_commission_percent, partner_flat_fee_cents, referral_code, payout_email')
        .eq('is_partner', true);

      if (partnersError) throw partnersError;

      // Load earnings for each partner
      const partnersWithEarnings = await Promise.all(
        (partnersData || []).map(async (partner) => {
          const { data: earningsData } = await supabase
            .rpc('get_partner_pending_earnings', { p_partner_id: partner.id });
          
          return {
            ...partner,
            earnings: earningsData?.[0] || null
          };
        })
      );

      setPartners(partnersWithEarnings);

      // Calculate total owed to partners
      const totalOwedToPartners = partnersWithEarnings.reduce(
        (sum, p) => sum + (p.earnings?.pending_earnings || 0), 
        0
      );

      // Load recent payouts
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('partner_payouts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (payoutsError) throw payoutsError;
      setPayouts(payoutsData || []);

      // Calculate total paid to partners
      const totalPaidToPartners = (payoutsData || [])
        .filter(p => p.status === 'sent' || p.status === 'confirmed')
        .reduce((sum, p) => sum + p.amount, 0);

      // Load platform fees from escrow transactions
      const { data: escrowData, error: escrowError } = await supabase
        .from('escrow_transactions')
        .select('id, bounty_id, amount, platform_fee_amount, captured_at')
        .eq('capture_status', 'captured')
        .not('platform_fee_amount', 'is', null)
        .order('captured_at', { ascending: false });

      if (escrowError) throw escrowError;

      const totalPlatformFees = (escrowData || []).reduce(
        (sum, e) => sum + (e.platform_fee_amount || 0), 
        0
      );

      // Load bounty details for the fee breakdown
      const bountyIds = (escrowData || []).map(e => e.bounty_id).filter(Boolean);
      let bountyMap: Record<string, string> = {};
      
      if (bountyIds.length > 0) {
        const { data: bountiesData } = await supabase
          .from('Bounties')
          .select('id, title')
          .in('id', bountyIds);
        
        bountyMap = (bountiesData || []).reduce((acc, b) => {
          acc[b.id] = b.title;
          return acc;
        }, {} as Record<string, string>);
      }

      // Build bounty fee breakdown
      // Note: For now, we don't have direct partner-bounty linking, 
      // so partner earnings are calculated from the RPC function
      const fees: CompletedBountyFee[] = (escrowData || []).map(e => ({
        bountyId: e.bounty_id || '',
        bountyTitle: bountyMap[e.bounty_id || ''] || 'Unknown Bounty',
        bountyAmount: e.amount,
        platformFee: e.platform_fee_amount || 0,
        capturedAt: e.captured_at || '',
        partnerName: null, // Would need referral tracking to show this
        partnerEarning: 0
      }));

      setBountyFees(fees);

      // Set revenue summary
      setRevenue({
        totalPlatformFees,
        totalBounties: (escrowData || []).length,
        totalOwedToPartners,
        totalPaidToPartners,
        netRevenue: totalPlatformFees - totalOwedToPartners - totalPaidToPartners
      });

    } catch (error) {
      console.error('Error loading payout data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payout data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openPayoutDialog = (partner: Partner & { earnings?: PartnerEarnings }) => {
    setSelectedPartner(partner);
    const partnerWithEarnings = partner as Partner & { earnings?: PartnerEarnings };
    setFormData({
      partner_id: partner.id,
      amount: partnerWithEarnings.earnings?.pending_earnings?.toFixed(2) || '',
      payment_method: 'paypal',
      payout_email: partner.payout_email || '',
      notes: ''
    });
    setDialogOpen(true);
  };

  const handleCreatePayout = async () => {
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount < 50) {
      toast({
        title: 'Invalid amount',
        description: 'Minimum payout is $50.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('partner_payouts')
        .insert({
          partner_id: formData.partner_id,
          amount: amount,
          payment_method: formData.payment_method,
          payout_email: formData.payout_email,
          notes: formData.notes || null,
          period_end: new Date().toISOString().split('T')[0],
          bounties_count: selectedPartner?.earnings?.bounties_count || 0
        });

      if (error) throw error;

      toast({
        title: 'Payout created',
        description: `Payout of ${formatUSD(amount)} created for ${selectedPartner?.partner_name || selectedPartner?.username}.`,
      });

      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error creating payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to create payout.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePayoutStatus = async (payoutId: string, newStatus: string) => {
    setUpdatingStatus(payoutId);
    try {
      const updates: Record<string, unknown> = { status: newStatus };
      
      if (newStatus === 'processing') {
        updates.processed_at = new Date().toISOString();
      } else if (newStatus === 'sent') {
        updates.sent_at = new Date().toISOString();
      } else if (newStatus === 'confirmed') {
        updates.confirmed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('partner_payouts')
        .update(updates)
        .eq('id', payoutId);

      if (error) throw error;

      toast({
        title: 'Status updated',
        description: `Payout marked as ${newStatus}.`,
      });

      loadData();
    } catch (error) {
      console.error('Error updating payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payout status.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3" /> Processing</Badge>;
      case 'sent':
        return <Badge className="gap-1 bg-blue-500"><Send className="h-3 w-3" /> Sent</Badge>;
      case 'confirmed':
        return <Badge className="gap-1 bg-green-600"><Check className="h-3 w-3" /> Confirmed</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPartnerName = (partner: Partner) => {
    return partner.partner_name || partner.username || partner.full_name || 'Unknown';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading payout data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Partners eligible for payout ($50+ pending)
  const eligiblePartners = partners.filter(p => (p.earnings?.pending_earnings || 0) >= 50);

  return (
    <div className="space-y-6">
      {/* Revenue Summary Cards */}
      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Platform Fees</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatUSD(revenue.totalPlatformFees)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    from {revenue.totalBounties} bounties
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                  <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Owed to Partners</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {formatUSD(revenue.totalOwedToPartners)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    pending payout
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid to Partners</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatUSD(revenue.totalPaidToPartners)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    sent/confirmed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Net Revenue</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatUSD(revenue.netRevenue)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    after partner payouts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fee Breakdown by Bounty */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Platform Fee Breakdown
          </CardTitle>
          <CardDescription>
            Fees collected from each completed bounty
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bountyFees.length === 0 ? (
            <p className="text-muted-foreground text-sm">No completed bounties yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">Bounty</th>
                    <th className="text-right py-2 px-2 font-medium">Amount</th>
                    <th className="text-right py-2 px-2 font-medium">Platform Fee</th>
                    <th className="text-right py-2 px-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bountyFees.map((fee) => (
                    <tr key={fee.bountyId} className="border-b border-muted">
                      <td className="py-3 px-2">
                        <span className="font-medium">{fee.bountyTitle}</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {formatUSD(fee.bountyAmount)}
                      </td>
                      <td className="py-3 px-2 text-right font-medium text-green-600 dark:text-green-400">
                        {formatUSD(fee.platformFee)}
                      </td>
                      <td className="py-3 px-2 text-right text-muted-foreground">
                        {fee.capturedAt ? format(new Date(fee.capturedAt), 'MMM d, yyyy') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50">
                    <td className="py-3 px-2 font-bold">Total</td>
                    <td className="py-3 px-2 text-right font-bold">
                      {formatUSD(bountyFees.reduce((sum, f) => sum + f.bountyAmount, 0))}
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-green-600 dark:text-green-400">
                      {formatUSD(bountyFees.reduce((sum, f) => sum + f.platformFee, 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eligible for Payout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Ready for Payout
          </CardTitle>
          <CardDescription>
            Partners with $50+ in pending earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eligiblePartners.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No partners have reached the $50 minimum threshold yet.
            </p>
          ) : (
            <div className="space-y-3">
              {eligiblePartners.map((partner) => (
                <div 
                  key={partner.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{getPartnerName(partner)}</p>
                    <p className="text-sm text-muted-foreground">
                      {partner.earnings?.bounties_count || 0} bounties • {partner.partner_commission_percent || 20}% commission
                      {partner.partner_flat_fee_cents ? ` + ${formatUSD(partner.partner_flat_fee_cents / 100)} flat` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-600">
                        {formatUSD(partner.earnings?.pending_earnings || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">pending</p>
                    </div>
                    <Button onClick={() => openPayoutDialog(partner)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Create Payout
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Partners Summary */}
      {partners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Partners</CardTitle>
            <CardDescription>
              Overview of all partner earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">Partner</th>
                    <th className="text-right py-2 px-2 font-medium">Commission</th>
                    <th className="text-right py-2 px-2 font-medium">Bounties</th>
                    <th className="text-right py-2 px-2 font-medium">Total Earned</th>
                    <th className="text-right py-2 px-2 font-medium">Paid</th>
                    <th className="text-right py-2 px-2 font-medium">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((partner) => (
                    <tr key={partner.id} className="border-b border-muted">
                      <td className="py-3 px-2">
                        <span className="font-medium">{getPartnerName(partner)}</span>
                        {partner.payout_email && (
                          <span className="block text-xs text-muted-foreground">{partner.payout_email}</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {partner.partner_flat_fee_cents ? `${formatUSD(partner.partner_flat_fee_cents / 100)} + ` : ''}
                        {partner.partner_commission_percent || 20}%
                      </td>
                      <td className="py-3 px-2 text-right">
                        {partner.earnings?.bounties_count || 0}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {formatUSD(partner.earnings?.total_earnings || 0)}
                      </td>
                      <td className="py-3 px-2 text-right text-blue-600">
                        {formatUSD(partner.earnings?.paid_earnings || 0)}
                      </td>
                      <td className="py-3 px-2 text-right font-medium text-green-600">
                        {formatUSD(partner.earnings?.pending_earnings || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Payouts */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>
            Recent partner payouts and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No payouts yet.</p>
          ) : (
            <div className="space-y-3">
              {payouts.map((payout) => {
                const partner = partners.find(p => p.id === payout.partner_id);
                return (
                  <div 
                    key={payout.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {partner ? getPartnerName(partner) : 'Unknown Partner'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payout.created_at), 'MMM d, yyyy')} • {payout.payment_method} • {payout.payout_email}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">{formatUSD(payout.amount)}</p>
                        {getStatusBadge(payout.status)}
                      </div>
                      <div className="flex gap-2">
                        {payout.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updatePayoutStatus(payout.id, 'sent')}
                            disabled={updatingStatus === payout.id}
                          >
                            {updatingStatus === payout.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-1" />
                                Mark Sent
                              </>
                            )}
                          </Button>
                        )}
                        {payout.status === 'sent' && (
                          <Button 
                            size="sm"
                            onClick={() => updatePayoutStatus(payout.id, 'confirmed')}
                            disabled={updatingStatus === payout.id}
                          >
                            {updatingStatus === payout.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Confirm
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Payout Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payout</DialogTitle>
            <DialogDescription>
              Send payment to {selectedPartner && getPartnerName(selectedPartner)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount (USD)</Label>
              <Input
                type="number"
                min="50"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="50.00"
              />
              <p className="text-xs text-muted-foreground">Minimum $50</p>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="venmo">Venmo</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="wise">Wise</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payout Email/Account</Label>
              <Input
                type="text"
                value={formData.payout_email}
                onChange={(e) => setFormData({ ...formData, payout_email: e.target.value })}
                placeholder="partner@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any notes about this payout..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePayout} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <DollarSign className="h-4 w-4 mr-1" />
              )}
              Create Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
