import { useState } from "react";
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
import { AlertTriangle, CheckCircle } from "lucide-react";

interface CancelBountyDialogProps {
  bountyId: string;
  bountyAmount: number;
  bountyCreatedAt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalPaid?: number;
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
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>No cancellation fees</strong>
              <p className="mt-1 text-sm text-muted-foreground">
                Your card was saved but never charged. Cancel anytime before approving a submission.
              </p>
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertDescription className="text-xs text-muted-foreground">
              Note: Bounties with accepted submissions cannot be cancelled. You can only cancel before approving any work.
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
            {isLoading ? "Cancelling..." : "Cancel Bounty"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
