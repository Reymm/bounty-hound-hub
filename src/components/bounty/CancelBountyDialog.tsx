import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Clock, DollarSign } from "lucide-react";

interface CancelBountyDialogProps {
  bountyId: string;
  bountyAmount: number;
  bountyCreatedAt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalPaid?: number; // Total amount user paid including fees
}

export function CancelBountyDialog({
  bountyId,
  bountyAmount,
  bountyCreatedAt,
  open,
  onOpenChange,
  totalPaid,
}: CancelBountyDialogProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [cancellationFee, setCancellationFee] = useState(0);
  const [refundAmount, setRefundAmount] = useState(totalPaid || bountyAmount);
  const [hoursElapsed, setHoursElapsed] = useState(0);

  useEffect(() => {
    if (open) {
      // Calculate hours elapsed
      const created = new Date(bountyCreatedAt);
      const now = new Date();
      const hours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      setHoursElapsed(Math.floor(hours));

      // Calculate fee (2% of bounty amount only, after 24 hours)
      const amountPaid = totalPaid || bountyAmount;
      if (hours > 24) {
        const fee = Math.round(bountyAmount * 0.02 * 100) / 100;
        setCancellationFee(fee);
        setRefundAmount(amountPaid - fee); // Refund total paid minus only the 2% fee
      } else {
        setCancellationFee(0);
        setRefundAmount(amountPaid); // Full refund of everything paid
      }
    }
  }, [open, bountyAmount, bountyCreatedAt, totalPaid]);

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to cancel bounty");
        return;
      }

      const { data, error } = await supabase.functions.invoke('cancel-bounty-with-fee', {
        body: { bountyId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast.success(data.message || "Bounty cancelled successfully");
      onOpenChange(false);
      navigate("/my-bounties");
    } catch (error) {
      console.error("Cancel bounty error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to cancel bounty");
    } finally {
      setIsLoading(false);
    }
  };

  const isWithin24Hours = hoursElapsed <= 24;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Cancel Bounty
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this bounty?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Posted {hoursElapsed} hours ago
            </span>
          </div>

          {isWithin24Hours ? (
            <Alert>
              <DollarSign className="h-4 w-4" />
              <AlertDescription>
                <strong>Free cancellation</strong> - Posted within 24 hours
                <div className="mt-2 text-lg font-semibold">
                  Full Refund: ${refundAmount.toFixed(2)}
                </div>
                {totalPaid && totalPaid > bountyAmount && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Includes refund of all platform and payment processing fees
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>2% cancellation fee applies</strong> - Posted over 24 hours ago
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Total Paid:</span>
                    <span className="font-medium">${(totalPaid || bountyAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cancellation Fee (2% of bounty):</span>
                    <span className="font-medium text-destructive">-${cancellationFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-semibold">
                    <span>Refund Amount:</span>
                    <span>${refundAmount.toFixed(2)}</span>
                  </div>
                  {totalPaid && totalPaid > bountyAmount && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Platform and payment processing fees will be refunded
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertDescription className="text-xs text-muted-foreground">
              Note: Bounties with accepted submissions cannot be cancelled. The escrow becomes non-refundable once a hunter's work is accepted.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Keep Bounty
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Cancelling..." : `Cancel & Get $${refundAmount.toFixed(2)} Refund`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
