import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabaseApi } from '@/lib/api/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ClaimType } from '@/lib/types';
import { Plus, X } from 'lucide-react';

interface ClaimDialogProps {
  bountyId: string;
  bountyTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onClaimSubmitted: () => void;
}

export function ClaimDialog({ bountyId, bountyTitle, isOpen, onClose, onClaimSubmitted }: ClaimDialogProps) {
  const [message, setMessage] = useState('');
  const [proofUrls, setProofUrls] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAddProofUrl = () => {
    setProofUrls([...proofUrls, '']);
  };

  const handleRemoveProofUrl = (index: number) => {
    setProofUrls(proofUrls.filter((_, i) => i !== index));
  };

  const handleProofUrlChange = (index: number, value: string) => {
    const updated = [...proofUrls];
    updated[index] = value;
    setProofUrls(updated);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit a claim.",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please provide details about your claim.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Filter out empty URLs
      const validUrls = proofUrls.filter(url => url.trim());

      await supabaseApi.createClaim(bountyId, {
        type: ClaimType.FOUND, // Default to 'found' type
        message: message.trim(),
        proofUrls: validUrls,
        proofImages: [] // No file uploads for now
      });

      toast({
        title: "Claim submitted successfully!",
        description: "The bounty poster will review your submission.",
        variant: "default",
      });

      // Reset form
      setMessage('');
      setProofUrls(['']);
      onClaimSubmitted();
      onClose();
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        title: "Error submitting claim",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Claim for "{bountyTitle}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="message">Your Claim Details *</Label>
            <Textarea
              id="message"
              placeholder="Explain how you found this item, where it is located, and any relevant details..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label>Proof URLs (Optional)</Label>
            <p className="text-sm text-muted-foreground">
              Add links to photos, websites, or other proof that supports your claim
            </p>
            
            {proofUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="https://example.com/proof-image.jpg"
                  value={url}
                  onChange={(e) => handleProofUrlChange(index, e.target.value)}
                />
                {proofUrls.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveProofUrl(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddProofUrl}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Proof URL
            </Button>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Claim'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}