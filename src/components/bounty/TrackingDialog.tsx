import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Package } from 'lucide-react';

interface TrackingDialogProps {
  submissionId: string;
  isOpen: boolean;
  onClose: () => void;
  onTrackingAdded: () => void;
}

export function TrackingDialog({ 
  submissionId, 
  isOpen, 
  onClose, 
  onTrackingAdded 
}: TrackingDialogProps) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Get submission and poster details
      const { data: submissionData } = await supabase
        .from('Submissions')
        .select('bounty_id, Bounties!bounty_id(title, poster_id)')
        .eq('id', submissionId)
        .single();

      const { error } = await supabase
        .from('Submissions')
        .update({ 
          tracking_number: trackingNumber.trim() || null,
          shipped_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;

      // Send email notification to poster via edge function
      if (submissionData) {
        try {
          await supabase.functions.invoke('send-shipping-notification', {
            body: { 
              bountyId: submissionData.bounty_id,
              type: 'item_shipped',
              trackingNumber: trackingNumber.trim() || null
            }
          });
        } catch (emailError) {
          console.error('Failed to send shipping notification email:', emailError);
          // Don't fail the whole operation if email fails
        }
      }

      toast({
        title: trackingNumber.trim() ? "Tracking added" : "Marked as shipped",
        description: trackingNumber.trim() 
          ? "The bounty poster has been notified with the tracking number."
          : "The bounty poster has been notified that the item was shipped.",
      });
      
      onTrackingAdded();
      onClose();
      setTrackingNumber('');
    } catch (error) {
      console.error('Error updating tracking:', error);
      toast({
        title: "Error",
        description: "Failed to update shipping information. Please try again.",
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
            <Package className="h-5 w-5" />
            Mark as Shipped
          </DialogTitle>
          <DialogDescription>
            Let the poster know you've shipped the item. Adding a tracking number is optional but recommended.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trackingNumber">Tracking Number (Optional)</Label>
            <Input
              id="trackingNumber"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g., 1Z999AA10123456784 (USPS, UPS, FedEx, etc.)"
            />
            <p className="text-xs text-muted-foreground">
              The poster will be able to track their package if you provide this.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {trackingNumber.trim() ? 'Add Tracking & Mark Shipped' : 'Mark as Shipped'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
