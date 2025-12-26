import { useState } from 'react';
import { DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface SendFundsDialogProps {
  bountyId: string;
  bountyTitle: string;
  hunterId: string;
  hunterName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PaymentFormProps {
  amount: number;
  stripeFee: number;
  totalCharge: number;
  hunterName: string;
  isManualPayout: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentForm({ amount, stripeFee, totalCharge, hunterName, isManualPayout, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/bounty/${window.location.pathname.split('/').pop()}`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        toast({
          title: "Payment sent!",
          description: `$${amount.toFixed(2)} has been sent to ${hunterName}.${isManualPayout ? ' (Manual transfer pending)' : ''}`,
        });
        onSuccess();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setError(message);
      toast({
        title: "Payment failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted p-4 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span>Amount to {hunterName}</span>
          <span className="font-medium">${amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Processing fee</span>
          <span>${stripeFee.toFixed(2)}</span>
        </div>
        <div className="border-t pt-2 flex justify-between font-semibold">
          <span>Total charge</span>
          <span>${totalCharge.toFixed(2)}</span>
        </div>
      </div>

      {isManualPayout && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This hunter requires manual payout. Funds will be held and transferred by an admin.
          </AlertDescription>
        </Alert>
      )}

      <PaymentElement />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isProcessing} className="flex-1">
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <DollarSign className="h-4 w-4 mr-2" />
              Send ${amount.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function SendFundsDialog({ 
  bountyId, 
  bountyTitle, 
  hunterId, 
  hunterName, 
  isOpen, 
  onClose,
  onSuccess 
}: SendFundsDialogProps) {
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{
    amount: number;
    stripeFee: number;
    totalCharge: number;
    isManualPayout: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCreatePayment = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 1) {
      setError('Please enter an amount of at least $1');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('send-additional-funds', {
        body: {
          hunterId,
          bountyId,
          amount: amountNum,
          note: note || undefined,
        },
      });

      if (response.error) throw new Error(response.error.message);
      
      const data = response.data;
      if (data.error) throw new Error(data.error);

      setClientSecret(data.client_secret);
      setPaymentDetails({
        amount: data.amount,
        stripeFee: data.stripe_fee,
        totalCharge: data.total_charge,
        isManualPayout: data.is_manual_payout,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create payment';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    setClientSecret(null);
    setPaymentDetails(null);
    setAmount('');
    setNote('');
    onSuccess?.();
    onClose();
  };

  const handleCancel = () => {
    setClientSecret(null);
    setPaymentDetails(null);
  };

  const handleClose = () => {
    setClientSecret(null);
    setPaymentDetails(null);
    setAmount('');
    setNote('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Send Additional Funds
          </DialogTitle>
          <DialogDescription>
            Send additional payment to {hunterName} for "{bountyTitle}"
          </DialogDescription>
        </DialogHeader>

        {clientSecret && paymentDetails ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#0F172A',
                },
              },
            }}
          >
            <PaymentForm
              amount={paymentDetails.amount}
              stripeFee={paymentDetails.stripeFee}
              totalCharge={paymentDetails.totalCharge}
              hunterName={hunterName}
              isManualPayout={paymentDetails.isManualPayout}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </Elements>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  max="10000"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                placeholder="e.g., Reimbursement for item purchase"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePayment} 
                disabled={isLoading || !amount}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
