import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  Shield, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EscrowStatus } from '@/lib/types';
import { mockApi } from '@/lib/api/mock';
import { useToast } from '@/hooks/use-toast';

export default function Checkout() {
  const [escrowState, setEscrowState] = useState<{
    status: EscrowStatus;
    transactionId?: string;
    amount?: number;
  }>({ status: EscrowStatus.PENDING });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Mock bounty data for demo
  const mockBounty = {
    id: 'b1',
    title: 'Looking for rare vintage Leica camera from 1960s',
    bountyAmount: 500,
    posterName: 'Sarah Chen',
    hunterName: 'David Kim'
  };

  const handleMockDeposit = async () => {
    try {
      setLoading(true);
      
      // Simulate escrow deposit
      const transaction = await mockApi.createEscrowDeposit(mockBounty.id, mockBounty.bountyAmount);
      
      setEscrowState({
        status: EscrowStatus.DEPOSITED,
        transactionId: transaction.id,
        amount: transaction.amount / 100 // Convert from cents
      });

      toast({
        title: "Escrow deposit successful",
        description: "Funds are now held securely until bounty completion.",
      });

    } catch (error) {
      console.error('Error creating escrow deposit:', error);
      toast({
        title: "Error processing deposit",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMockRelease = async () => {
    if (!escrowState.transactionId) return;

    try {
      setLoading(true);
      
      const success = await mockApi.releaseEscrow(escrowState.transactionId);
      
      if (success) {
        setEscrowState(prev => ({ ...prev, status: EscrowStatus.RELEASED }));
        toast({
          title: "Payment released",
          description: "Funds have been transferred to the hunter.",
        });
      }

    } catch (error) {
      console.error('Error releasing escrow:', error);
      toast({
        title: "Error releasing payment",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMockRefund = async () => {
    if (!escrowState.transactionId) return;

    try {
      setLoading(true);
      
      const success = await mockApi.refundEscrow(escrowState.transactionId);
      
      if (success) {
        setEscrowState(prev => ({ ...prev, status: EscrowStatus.REFUNDED }));
        toast({
          title: "Refund processed",
          description: "Funds have been returned to your account.",
        });
      }

    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: "Error processing refund",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: EscrowStatus) => {
    switch (status) {
      case EscrowStatus.PENDING:
        return <Badge variant="secondary">Pending</Badge>;
      case EscrowStatus.DEPOSITED:
        return <Badge className="status-pending">Deposited</Badge>;
      case EscrowStatus.RELEASED:
        return <Badge className="status-completed">Released</Badge>;
      case EscrowStatus.REFUNDED:
        return <Badge variant="destructive">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation */}
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Escrow & Payments</h1>
        <p className="text-muted-foreground">
          Secure payment processing for BountyBay transactions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                How BountyBay Escrow Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Secure Deposit</h3>
                    <p className="text-sm text-muted-foreground">
                      Bounty poster deposits the bounty amount using Stripe. Funds are held securely in escrow.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Hunter Finds Item</h3>
                    <p className="text-sm text-muted-foreground">
                      Hunter submits proof of finding the item according to verification requirements.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Approval & Release</h3>
                    <p className="text-sm text-muted-foreground">
                      Poster reviews and approves the delivery. Funds are released to hunter minus $2 + 5% platform fee.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demo Transaction */}
          <Card>
            <CardHeader>
              <CardTitle>Demo Escrow Transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This is a demonstration of the escrow flow. Real transactions will use Stripe for secure payment processing.
                </AlertDescription>
              </Alert>

              {/* Mock Bounty Details */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Sample Bounty</h4>
                <p className="text-sm text-foreground mb-2">{mockBounty.title}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Poster: {mockBounty.posterName}</span>
                  <div className="bounty-amount font-semibold">
                    ${mockBounty.bountyAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Transaction Status */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Escrow Status</h4>
                  {getStatusBadge(escrowState.status)}
                </div>

                {escrowState.transactionId && (
                  <div className="text-sm text-muted-foreground">
                    Transaction ID: {escrowState.transactionId}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {escrowState.status === EscrowStatus.PENDING && (
                    <Button 
                      onClick={handleMockDeposit}
                      disabled={loading}
                      className="bg-primary hover:bg-primary-hover text-primary-foreground"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {loading ? 'Processing...' : 'Mock Deposit'}
                    </Button>
                  )}

                  {escrowState.status === EscrowStatus.DEPOSITED && (
                    <>
                      <Button 
                        onClick={handleMockRelease}
                        disabled={loading}
                        className="bg-success hover:bg-success/90 text-success-foreground"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {loading ? 'Processing...' : 'Mock Release'}
                      </Button>

                      <Button 
                        onClick={handleMockRefund}
                        disabled={loading}
                        variant="destructive"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {loading ? 'Processing...' : 'Mock Refund'}
                      </Button>
                    </>
                  )}
                </div>

                {/* Status Messages */}
                {escrowState.status === EscrowStatus.DEPOSITED && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Funds are held in escrow. Release payment when you're satisfied with the hunter's delivery.
                    </AlertDescription>
                  </Alert>
                )}

                {escrowState.status === EscrowStatus.RELEASED && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Payment has been released to {mockBounty.hunterName}. Transaction complete!
                    </AlertDescription>
                  </Alert>
                )}

                {escrowState.status === EscrowStatus.REFUNDED && (
                  <Alert>
                    <ArrowLeft className="h-4 w-4" />
                    <AlertDescription>
                      Funds have been refunded to your account. The bounty can be reposted if needed.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Integration TODOs */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Stripe Integration TODOs</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Set up Stripe Connect Express accounts for hunters</li>
                    <li>• Implement PaymentIntents for escrow deposits</li>
                    <li>• Create transfer endpoints for releasing funds</li>
                    <li>• Set up webhooks for payment status updates</li>
                    <li>• Add dispute resolution mechanism</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Supabase Integration TODOs</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Create escrow_transactions table</li>
                    <li>• Add RLS policies for transaction access</li>
                    <li>• Store Stripe Connect account IDs in profiles</li>
                    <li>• Track payment status changes</li>
                    <li>• Implement transaction history</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Payment Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                <span>Stripe-powered payments</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                <span>Bank-level encryption</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                <span>PCI DSS compliant</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                <span>Dispute protection</span>
              </div>
            </CardContent>
          </Card>

          {/* Fee Structure */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fee Structure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground mb-2">Example: $100 bounty</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Poster pays</span>
                <span className="font-medium">$103.94</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground pl-2">
                <span>↳ Bounty reward</span>
                <span>$100.00</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground pl-2">
                <span>↳ Stripe fee (3.5% + $0.30)</span>
                <span>$3.94</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hunter receives</span>
                <span className="font-medium">$93.00</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground pl-2">
                <span>↳ Platform fee ($2 + 5%)</span>
                <span>-$7.00</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-medium text-primary">
                <span>Platform keeps</span>
                <span>~$7.00</span>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/legal/terms">
                  View Terms of Service
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                Contact Support
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                Dispute Resolution
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}