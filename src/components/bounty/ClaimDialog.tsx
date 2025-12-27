import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabaseApi } from '@/lib/api/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ClaimType } from '@/lib/types';
import { Plus, X, CreditCard, Loader2, CheckCircle } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { uploadFile, resolveStorageUrls } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';

interface ClaimDialogProps {
  bountyId: string;
  bountyTitle: string;
  bountyAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onClaimSubmitted: () => void;
}

interface ExistingSubmission {
  id: string;
  status: string;
  message: string | null;
  proof_urls: string[] | null;
}

export function ClaimDialog({ bountyId, bountyTitle, bountyAmount, isOpen, onClose, onClaimSubmitted }: ClaimDialogProps) {
  const [message, setMessage] = useState('');
  const [proofUrls, setProofUrls] = useState<string[]>(['']);
  // uploadedImageRefs stores the storage references (supabase-storage://...)
  const [uploadedImageRefs, setUploadedImageRefs] = useState<string[]>([]);
  // uploadedImageDisplay stores resolved URLs for display in ImageUpload
  const [uploadedImageDisplay, setUploadedImageDisplay] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stripeConnectRequired, setStripeConnectRequired] = useState(false);
  const [stripeConnectChecking, setStripeConnectChecking] = useState(false);
  const [startingStripeOnboarding, setStartingStripeOnboarding] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<ExistingSubmission | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if a URL is an image (storage reference or Supabase URL)
  const isImageRef = (url: string) => {
    return url.startsWith('supabase-storage://') || 
           url.includes('supabase.co/storage/v1/object');
  };

  // Check if user already has a submission for this bounty
  useEffect(() => {
    const checkExistingSubmission = async () => {
      if (!isOpen || !user) return;
      
      setCheckingExisting(true);
      try {
        const { data } = await supabase
          .from('Submissions')
          .select('id, status, message, proof_urls')
          .eq('bounty_id', bountyId)
          .eq('hunter_id', user.id)
          .maybeSingle();
        
        setExistingSubmission(data);
        
        // If there's an existing editable submission, pre-fill the form
        if (data && data.status === 'submitted') {
          setIsEditMode(true);
          setMessage(data.message || '');
          
          // Separate uploaded images from proof URLs
          const urls = data.proof_urls || [];
          const imageRefs = urls.filter(isImageRef);
          const otherUrls = urls.filter(url => !isImageRef(url));
          
          setUploadedImageRefs(imageRefs);
          setProofUrls(otherUrls.length > 0 ? otherUrls : ['']);
          
          // Resolve the image references for display
          if (imageRefs.length > 0) {
            const resolved = await resolveStorageUrls(imageRefs);
            setUploadedImageDisplay(resolved);
          } else {
            setUploadedImageDisplay([]);
          }
        } else {
          setIsEditMode(false);
        }
      } catch (error) {
        console.error('Error checking existing submission:', error);
      } finally {
        setCheckingExisting(false);
      }
    };
    
    checkExistingSubmission();
  }, [isOpen, user, bountyId]);

  // Computed states
  const hasExistingSubmission = !!existingSubmission;
  const canEdit = existingSubmission?.status === 'submitted';

  // Check if Stripe Connect and KYC are required
  useEffect(() => {
    const checkRequirements = async () => {
      if (!isOpen || !user) return;

      // Check Stripe Connect status first
      setStripeConnectChecking(true);
      try {
        const { data, error } = await supabase.functions.invoke('check-connect-status');
        
        if (error) {
          console.error('Error checking Stripe Connect:', error);
          setStripeConnectRequired(true);
        } else {
          // Require Stripe Connect if not fully onboarded
          setStripeConnectRequired(!data?.onboarding_complete);
        }
      } catch (error) {
        console.error('Error checking Stripe Connect:', error);
        setStripeConnectRequired(true);
      } finally {
        setStripeConnectChecking(false);
      }

    };

    checkRequirements();
  }, [isOpen, user]);

  const handleStartStripeOnboarding = async () => {
    setStartingStripeOnboarding(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account');
      
      if (error) throw error;
      
      if (data?.onboarding_url) {
        window.location.href = data.onboarding_url;
      } else {
        throw new Error('No onboarding URL received');
      }
    } catch (error: any) {
      console.error('Error starting Stripe onboarding:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start payout setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setStartingStripeOnboarding(false);
    }
  };

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

  const handleImageUpload = async (files: File[], onProgress?: (fileName: string, progress: number) => void) => {
    try {
      const uploadPromises = files.map(file => 
        uploadFile(file, 'submission-files', user!.id, undefined, (progress) => {
          onProgress?.(file.name, progress);
        })
      );
      const uploadResults = await Promise.all(uploadPromises);
      
      // Get the storage references (supabase-storage://...)
      const successfulRefs = uploadResults
        .filter(result => !result.error && result.url)
        .map(result => result.url!);
      
      const failedUploads = uploadResults.filter(result => result.error);
      
      if (failedUploads.length > 0) {
        const errorMessages = failedUploads
          .map(r => r.error)
          .filter(Boolean)
          .join(', ');
        
        toast({
          title: "Some uploads failed",
          description: errorMessages || "Please try again",
          variant: "destructive",
        });
      }
      
      if (successfulRefs.length > 0) {
        // Add storage references
        const newRefs = [...uploadedImageRefs, ...successfulRefs];
        setUploadedImageRefs(newRefs);
        
        // Resolve and add display URLs
        const resolvedUrls = await resolveStorageUrls(successfulRefs);
        setUploadedImageDisplay(prev => [...prev, ...resolvedUrls]);
        
        toast({
          title: "Images uploaded",
          description: `${successfulRefs.length} image(s) uploaded successfully.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
    }
  };

  const handleImageRemove = async (displayUrl: string) => {
    // Find the index in display array
    const index = uploadedImageDisplay.indexOf(displayUrl);
    if (index !== -1) {
      // Remove from both arrays at the same index
      setUploadedImageRefs(prev => prev.filter((_, i) => i !== index));
      setUploadedImageDisplay(prev => prev.filter((_, i) => i !== index));
    }
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

    if (stripeConnectRequired) {
      toast({
        title: "Payout setup required",
        description: "Please set up your payout account before claiming bounties.",
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

      // Filter out empty URLs and combine with uploaded image references
      const validUrls = proofUrls.filter(url => url.trim());
      const allProofUrls = [...validUrls, ...uploadedImageRefs];

      if (isEditMode && existingSubmission) {
        // Update existing submission
        const { error } = await supabase
          .from('Submissions')
          .update({
            message: message.trim(),
            proof_urls: allProofUrls.length > 0 ? allProofUrls : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubmission.id);

        if (error) throw error;

        toast({
          title: "Claim updated successfully!",
          description: "Your changes have been saved.",
          variant: "default",
        });
      } else {
        // Create new submission
        await supabaseApi.createClaim(bountyId, {
          type: ClaimType.FOUND,
          message: message.trim(),
          proofUrls: validUrls,
          proofImages: uploadedImageRefs
        });

        toast({
          title: "Claim submitted successfully!",
          description: "The bounty poster will review your submission.",
          variant: "default",
        });
      }

      // Reset form
      setMessage('');
      setProofUrls(['']);
      setUploadedImageRefs([]);
      setUploadedImageDisplay([]);
      setExistingSubmission(null);
      setIsEditMode(false);
      onClaimSubmitted();
      onClose();
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        title: isEditMode ? "Error updating claim" : "Error submitting claim",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? `Edit Claim for "${bountyTitle}"` : `Submit Claim for "${bountyTitle}"`}
          </DialogTitle>
        </DialogHeader>

        {/* Already submitted and NOT editable */}
        {hasExistingSubmission && !canEdit && !checkingExisting && (
          <Alert className="border-amber-500 bg-amber-500/10">
            <CheckCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-foreground">You've already submitted a claim</p>
                <p className="text-muted-foreground">
                  Your claim has been reviewed and can no longer be edited. View your submission in the "My Claim" tab on this bounty page.
                </p>
                <Button onClick={onClose} variant="outline" className="mt-2">
                  Close
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {checkingExisting && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Show form if: no existing submission OR existing submission is editable */}
        {((!hasExistingSubmission || canEdit) && !checkingExisting) && (
          <>

        {/* Stripe Connect Setup Alert - Show first as it's the primary requirement */}
        {stripeConnectRequired && !stripeConnectChecking && (
          <Alert className="border-primary bg-primary/5">
            <CreditCard className="h-4 w-4 text-primary" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Set Up Payouts First</p>
                <p className="text-muted-foreground">
                  Before you can claim bounties, you need to set up your payout account so you can receive rewards when your claims are accepted.
                </p>
                <Button 
                  onClick={handleStartStripeOnboarding} 
                  className="mt-2"
                  disabled={startingStripeOnboarding}
                >
                  {startingStripeOnboarding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Set Up Payout Account
                    </>
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {stripeConnectChecking && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Checking payout account status...</AlertDescription>
          </Alert>
        )}

        {/* Stripe Connect Connected Success Indicator */}
        {!stripeConnectChecking && !stripeConnectRequired && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Payout account connected
            </AlertDescription>
          </Alert>
        )}

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

          <div className="space-y-3">
            <Label>Upload Proof Images</Label>
            <p className="text-sm text-muted-foreground">
              Upload photos or documents that support your claim
            </p>
            <ImageUpload
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              uploadedImages={uploadedImageDisplay}
              maxFiles={5}
              maxSize={10 * 1024 * 1024} // 10MB
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || stripeConnectRequired || stripeConnectChecking}
            >
              {isSubmitting ? (isEditMode ? 'Updating...' : 'Submitting...') : 
               stripeConnectRequired ? 'Payout Setup Required' :
               isEditMode ? 'Update Claim' : 'Submit Claim'}
            </Button>
          </div>
        </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}