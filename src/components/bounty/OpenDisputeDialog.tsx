import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle } from 'lucide-react';

interface OpenDisputeDialogProps {
  submissionId: string;
  bountyId: string;
  isOpen: boolean;
  onClose: () => void;
  onDisputeOpened: () => void;
}

export function OpenDisputeDialog({ 
  submissionId,
  bountyId,
  isOpen, 
  onClose, 
  onDisputeOpened 
}: OpenDisputeDialogProps) {
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!disputeReason.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a reason for opening this dispute.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get submission and hunter details
      const { data: submissionData } = await supabase
        .from('Submissions')
        .select('hunter_id, bounty_id, Bounties!bounty_id(title)')
        .eq('id', submissionId)
        .single();

      // Update submission with dispute info
      const { error: submissionError } = await supabase
        .from('Submissions')
        .update({ 
          dispute_opened: true,
          dispute_reason: disputeReason.trim(),
          dispute_opened_at: new Date().toISOString(),
          status: 'submitted' // Keep as submitted, not rejected
        })
        .eq('id', submissionId);

      if (submissionError) throw submissionError;

      // Create a support ticket for admin review
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase
          .from('support_tickets')
          .insert({
            title: `Dispute: Submission Issue`,
            description: `A dispute has been opened for a submission.\n\nReason: ${disputeReason.trim()}`,
            type: 'submission_dispute',
            priority: 'high',
            created_by: userData.user.id,
            bounty_id: bountyId,
            submission_id: submissionId
          });

        // Send email notification to hunter
        if (submissionData) {
          const { data: hunterAuth } = await supabase.auth.admin.getUserById(submissionData.hunter_id);
          
          if (hunterAuth?.user) {
            await supabase.functions.invoke('send-notification-email', {
              body: {
                type: 'dispute_opened',
                recipientEmail: hunterAuth.user.email!,
                recipientName: hunterAuth.user.email?.split('@')[0] || 'Hunter',
                bountyTitle: (submissionData.Bounties as any).title,
                bountyId: submissionData.bounty_id,
                senderName: userData.user.email?.split('@')[0] || 'Poster',
                disputeReason: disputeReason.trim()
              }
            });
          }
        }
      }

      toast({
        title: "Dispute opened",
        description: "A support admin will review this submission and contact you within 24-48 hours.",
      });
      
      onDisputeOpened();
      onClose();
      setDisputeReason('');
    } catch (error) {
      console.error('Error opening dispute:', error);
      toast({
        title: "Error",
        description: "Failed to open dispute. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Open Dispute
          </DialogTitle>
          <DialogDescription>
            This will escalate the submission to our support team for review. The bounty will be frozen until the dispute is resolved.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Opening a dispute will notify our support team. They will investigate and mediate between you and the hunter. This process typically takes 24-48 hours.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="disputeReason">Why are you opening a dispute?</Label>
            <Textarea
              id="disputeReason"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="e.g., Item doesn't match description, fake proof, hunter is unresponsive, wrong item sent, etc..."
              rows={5}
            />
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || !disputeReason.trim()}
            className="w-full sm:w-auto"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Open Dispute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
