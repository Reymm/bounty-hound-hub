import { useState } from 'react';
import { DollarSign, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
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

interface SendFundsDialogProps {
  bountyId: string;
  bountyTitle: string;
  hunterId: string;
  hunterName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ amount: number; hunterName: string } | null>(null);
  const { toast } = useToast();

  const handleSendFunds = async () => {
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

      // Payment succeeded instantly using saved card
      setSuccess({ amount: data.amount, hunterName: data.hunter_name });
      toast({
        title: "Payment sent! 💰",
        description: `$${data.amount.toFixed(2)} has been sent to ${data.hunter_name}.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send payment';
      setError(message);
      toast({
        title: "Payment failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (success) {
      onSuccess?.();
    }
    setAmount('');
    setNote('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  // Calculate fee preview
  const amountNum = parseFloat(amount) || 0;
  const stripeFee = amountNum > 0 ? Math.round(((amountNum + 0.30) / (1 - 0.029) - amountNum) * 100) / 100 : 0;
  const totalCharge = amountNum > 0 ? Math.round((amountNum + stripeFee) * 100) / 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Send Additional Funds
          </DialogTitle>
          <DialogDescription>
            Send additional payment to {hunterName} for "{bountyTitle}"
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Payment Sent!</h3>
                <p className="text-muted-foreground">
                  ${success.amount.toFixed(2)} has been sent to {success.hunterName}
                </p>
              </div>
            </div>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
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

            {amountNum > 0 && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Amount to {hunterName}</span>
                  <span className="font-medium">${amountNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Processing fee</span>
                  <span>${stripeFee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total charge</span>
                  <span>${totalCharge.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Your saved payment method will be charged
                </p>
              </div>
            )}

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
                onClick={handleSendFunds} 
                disabled={isLoading || !amount || amountNum < 1}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Send ${amountNum > 0 ? amountNum.toFixed(2) : '0.00'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
