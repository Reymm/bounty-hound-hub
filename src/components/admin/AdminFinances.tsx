import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { supabase } from '@/integrations/supabase/client';
import { formatUSD } from '@/components/ui/currency-display';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Users,
  Download,
  RefreshCw,
  AlertTriangle,
  Wrench
} from 'lucide-react';
import { XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface EscrowTransaction {
  id: string;
  amount: number;
  platform_fee_amount: number | null;
  stripe_fee_amount: number | null;
  total_charged_amount: number | null;
  payout_sent_amount: number | null;
  captured_at: string | null;
  created_at: string;
  capture_status: string | null;
  bounty_id: string | null;
  bounty_title?: string;
  capture_locked_at?: string | null;
}

interface StuckTransaction {
  id: string;
  bounty_id: string | null;
  amount: number;
  capture_status: string;
  capture_locked_at: string | null;
  created_at: string;
  bounty_title?: string;
}

interface FinanceStats {
  totalPlatformFees: number;
  totalBountyValue: number;
  totalStripeFees: number;
  totalHunterPayouts: number;
  transactionCount: number;
}

interface MonthlyData {
  month: string;
  platformFees: number;
  bountyValue: number;
  transactions: number;
}

export function AdminFinances() {
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [stuckTransactions, setStuckTransactions] = useState<StuckTransaction[]>([]);
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchFinanceData = async () => {
    try {
      // Fetch captured escrow transactions
      const { data: escrowData, error: escrowError } = await supabase
        .from('escrow_transactions')
        .select(`
          id,
          amount,
          platform_fee_amount,
          stripe_fee_amount,
          total_charged_amount,
          payout_sent_amount,
          captured_at,
          created_at,
          capture_status,
          bounty_id
        `)
        .eq('capture_status', 'captured')
        .order('captured_at', { ascending: false });

      if (escrowError) throw escrowError;

      // Fetch stuck transactions (capturing for more than 10 minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: stuckData } = await supabase
        .from('escrow_transactions')
        .select(`
          id,
          amount,
          capture_status,
          capture_locked_at,
          created_at,
          bounty_id
        `)
        .eq('capture_status', 'capturing')
        .lt('capture_locked_at', tenMinutesAgo);

      // Process stuck transactions
      const stuckWithTitles: StuckTransaction[] = [];
      for (const tx of stuckData || []) {
        let bountyTitle = 'Unknown Bounty';
        if (tx.bounty_id) {
          const { data: bountyData } = await supabase
            .from('Bounties')
            .select('title')
            .eq('id', tx.bounty_id)
            .maybeSingle();
          if (bountyData) bountyTitle = bountyData.title;
        }
        stuckWithTitles.push({ ...tx, bounty_title: bountyTitle });
      }
      setStuckTransactions(stuckWithTitles);

      // Fetch bounty titles for each transaction
      const transactionsWithTitles: EscrowTransaction[] = [];
      
      for (const tx of escrowData || []) {
        let bountyTitle = 'Unknown Bounty';
        
        if (tx.bounty_id) {
          const { data: bountyData } = await supabase
            .from('Bounties')
            .select('title')
            .eq('id', tx.bounty_id)
            .maybeSingle();
          
          if (bountyData) {
            bountyTitle = bountyData.title;
          }
        }
        
        transactionsWithTitles.push({
          ...tx,
          bounty_title: bountyTitle
        });
      }

      setTransactions(transactionsWithTitles);

      // Calculate stats
      const capturedTransactions = escrowData?.filter(t => t.capture_status === 'captured') || [];
      
      const totalPlatformFees = capturedTransactions.reduce(
        (sum, t) => sum + (t.platform_fee_amount || 0), 0
      );
      const totalBountyValue = capturedTransactions.reduce(
        (sum, t) => sum + (t.amount || 0), 0
      );
      const totalStripeFees = capturedTransactions.reduce(
        (sum, t) => sum + (t.stripe_fee_amount || 0), 0
      );
      const totalHunterPayouts = capturedTransactions.reduce(
        (sum, t) => sum + (t.payout_sent_amount || 0), 0
      );

      setStats({
        totalPlatformFees,
        totalBountyValue,
        totalStripeFees,
        totalHunterPayouts,
        transactionCount: capturedTransactions.length
      });

      // Calculate monthly data for charts
      const monthlyMap = new Map<string, MonthlyData>();
      
      for (const tx of capturedTransactions) {
        const date = tx.captured_at ? new Date(tx.captured_at) : new Date(tx.created_at);
        const monthKey = format(date, 'MMM yyyy');
        
        const existing = monthlyMap.get(monthKey) || {
          month: monthKey,
          platformFees: 0,
          bountyValue: 0,
          transactions: 0
        };
        
        existing.platformFees += tx.platform_fee_amount || 0;
        existing.bountyValue += tx.amount || 0;
        existing.transactions += 1;
        
        monthlyMap.set(monthKey, existing);
      }
      
      setMonthlyData(Array.from(monthlyMap.values()).reverse());

    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFinanceData();
  };

  const exportToCSV = () => {
    if (!transactions.length) return;
    
    const headers = ['Date', 'Bounty', 'Bounty Amount', 'Platform Fee', 'Stripe Fee', 'Hunter Payout', 'Status'];
    const rows = transactions.map(tx => [
      tx.captured_at ? format(new Date(tx.captured_at), 'yyyy-MM-dd HH:mm') : 'N/A',
      tx.bounty_title || 'Unknown',
      tx.amount?.toFixed(2) || '0.00',
      tx.platform_fee_amount?.toFixed(2) || '0.00',
      tx.stripe_fee_amount?.toFixed(2) || '0.00',
      tx.payout_sent_amount?.toFixed(2) || '0.00',
      tx.capture_status || 'unknown'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform-fees-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFixStuckTransaction = async (txId: string, bountyAmount: number) => {
    try {
      // Calculate standard fees
      const platformFee = bountyAmount * 0.05 + 2; // 5% + $2 flat
      const stripeFee = bountyAmount * 0.029 + 0.30; // ~2.9% + $0.30
      const hunterPayout = bountyAmount - platformFee;
      const totalCharged = bountyAmount + stripeFee;

      const { error } = await supabase
        .from('escrow_transactions')
        .update({
          capture_status: 'captured',
          captured_at: new Date().toISOString(),
          total_charged_amount: totalCharged,
          stripe_fee_amount: stripeFee,
          platform_fee_amount: platformFee,
          payout_sent_amount: hunterPayout,
          capture_lock_id: null,
          capture_locked_at: null,
        })
        .eq('id', txId);

      if (error) throw error;

      toast({
        title: 'Transaction Fixed',
        description: `Marked as captured with $${platformFee.toFixed(2)} platform fee.`,
      });

      fetchFinanceData();
    } catch (error) {
      console.error('Error fixing transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to fix transaction. Check console.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Stuck Transactions Alert */}
      {stuckTransactions.length > 0 && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-destructive">Stuck Transactions Detected</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-3">
              {stuckTransactions.length} transaction(s) have been stuck in "capturing" status for more than 10 minutes.
              This usually means Stripe succeeded but the database update failed.
            </p>
            <div className="space-y-2">
              {stuckTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between bg-background/50 p-2 rounded border">
                  <div>
                    <span className="font-medium">{tx.bounty_title}</span>
                    <span className="text-muted-foreground ml-2">({formatUSD(tx.amount, true)})</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleFixStuckTransaction(tx.id, tx.amount)}
                  >
                    <Wrench className="h-3 w-3 mr-1" />
                    Fix Now
                  </Button>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Platform Finances</h2>
          <p className="text-muted-foreground">
            Track your platform fees and revenue
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!transactions.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Platform Fees Collected
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatUSD(stats?.totalPlatformFees || 0, true)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your revenue from {stats?.transactionCount || 0} transaction(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bounty Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatUSD(stats?.totalBountyValue || 0, true)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total value processed through platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stripe Fees (Poster Paid)
            </CardTitle>
            <CreditCard className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatUSD(stats?.totalStripeFees || 0, true)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Processing fees paid by posters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hunter Payouts
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatUSD(stats?.totalHunterPayouts || 0, true)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total paid to hunters via Stripe Connect
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                platformFees: {
                  label: "Platform Fees",
                  color: "hsl(var(--chart-1))",
                },
                bountyValue: {
                  label: "Bounty Value",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="platformFees" 
                    fill="hsl(var(--chart-1))" 
                    name="Platform Fees"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Transaction Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No captured transactions yet</p>
              <p className="text-sm">Completed bounty payouts will appear here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Bounty</TableHead>
                  <TableHead className="text-right">Bounty Amount</TableHead>
                  <TableHead className="text-right">Platform Fee</TableHead>
                  <TableHead className="text-right">Stripe Fee</TableHead>
                  <TableHead className="text-right">Hunter Payout</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap">
                      {tx.captured_at 
                        ? format(new Date(tx.captured_at), 'MMM d, yyyy HH:mm')
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {tx.bounty_title || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatUSD(tx.amount || 0, true)}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {formatUSD(tx.platform_fee_amount || 0, true)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {formatUSD(tx.stripe_fee_amount || 0, true)}
                    </TableCell>
                    <TableCell className="text-right text-blue-600">
                      {formatUSD(tx.payout_sent_amount || 0, true)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={tx.capture_status === 'captured' ? 'default' : 'secondary'}
                        className={tx.capture_status === 'captured' ? 'bg-green-500' : ''}
                      >
                        {tx.capture_status || 'unknown'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Fee Breakdown Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">💡 How Fees Work</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Platform Fee:</strong> 5% + $2 flat fee per bounty (your revenue, retained in your Stripe balance)</p>
            <p><strong>Stripe Fee:</strong> ~2.9% + $0.30 (paid by the poster, goes to Stripe)</p>
            <p><strong>Hunter Payout:</strong> Bounty amount minus platform fee (transferred to hunter's Stripe Connect)</p>
            <p className="mt-2 text-xs opacity-75">
              Note: Platform fees appear in your Stripe Balance History under "Destination Platform Fee" when you export to CSV.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
