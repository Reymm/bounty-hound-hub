import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface RequestRevisionDialogProps {
  submissionId: string;
  isOpen: boolean;
  onClose: () => void;
  onRevisionRequested: () => void;
}

export function RequestRevisionDialog({ 
  submissionId, 
  isOpen, 
  onClose, 
  onRevisionRequested 
}: RequestRevisionDialogProps) {
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!revisionNotes.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide details about what needs to be revised.",
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

      const { error } = await supabase
        .from('Submissions')
        .update({ 
          revision_requested: true,
          revision_notes: revisionNotes.trim()
        })
        .eq('id', submissionId);

      if (error) throw error;

      // Send email notification to hunter
      if (submissionData) {
        const { data: hunterAuth } = await supabase.auth.admin.getUserById(submissionData.hunter_id);
        const { data: posterData } = await supabase.auth.getUser();
        
        if (hunterAuth?.user && posterData?.user) {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'revision_requested',
              recipientEmail: hunterAuth.user.email!,
              recipientName: hunterAuth.user.email?.split('@')[0] || 'Hunter',
              bountyTitle: (submissionData.Bounties as any).title,
              bountyId: submissionData.bounty_id,
              senderName: posterData.user.email?.split('@')[0] || 'Poster',
              revisionNotes: revisionNotes.trim()
            }
          });
        }
      }

      toast({
        title: "Revision requested",
        description: "The hunter has been notified about the requested changes.",
      });
      
      onRevisionRequested();
      onClose();
      setRevisionNotes('');
    } catch (error) {
      console.error('Error requesting revision:', error);
      toast({
        title: "Error",
        description: "Failed to request revision. Please try again.",
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
          <DialogTitle>Request Revisions</DialogTitle>
          <DialogDescription>
            Let the hunter know what changes or improvements you'd like before accepting this submission.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="revisionNotes">What needs to be changed?</Label>
            <Textarea
              id="revisionNotes"
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="Please provide more details about the item's condition, better photos, additional verification, etc..."
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
            onClick={handleSubmit}
            disabled={isSubmitting || !revisionNotes.trim()}
            className="w-full sm:w-auto"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Request Revision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
