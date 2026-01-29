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
import { Plus, X, CreditCard, Loader2, CheckCircle, Info, ShieldCheck, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  
  // Verification states
  const [identityVerified, setIdentityVerified] = useState(false);
  const [identityChecking, setIdentityChecking] = useState(false);
  const [startingIdentityVerification, setStartingIdentityVerification] = useState(false);
  const [stripeConnectComplete, setStripeConnectComplete] = useState(false);
  const [stripeConnectChecking, setStripeConnectChecking] = useState(false);
  const [startingStripeOnboarding, setStartingStripeOnboarding] = useState(false);
  
  // Store the onboarding URL for mobile fallback
  const [stripeOnboardingUrl, setStripeOnboardingUrl] = useState<string | null>(null);
  
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

  // Check verification requirements
  useEffect(() => {
    const checkRequirements = async () => {
      if (!isOpen || !user) return;

      // Check Identity Verification status
      setIdentityChecking(true);
      try {
        const { data, error } = await supabase.functions.invoke('check-identity-status');
        
        if (error) {
          console.error('Error checking identity status:', error);
          setIdentityVerified(false);
        } else {
          setIdentityVerified(data?.verified === true);
        }
      } catch (error) {
        console.error('Error checking identity status:', error);
        setIdentityVerified(false);
      } finally {
        setIdentityChecking(false);
      }

      // Check Stripe Connect status
      setStripeConnectChecking(true);
      try {
        const { data, error } = await supabase.functions.invoke('check-connect-status');
        
        if (error) {
          console.error('Error checking Stripe Connect:', error);
          setStripeConnectComplete(false);
        } else {
          setStripeConnectComplete(data?.onboarding_complete === true);
        }
      } catch (error) {
        console.error('Error checking Stripe Connect:', error);
        setStripeConnectComplete(false);
      } finally {
        setStripeConnectChecking(false);
      }
    };

    checkRequirements();
  }, [isOpen, user]);

  const handleStartIdentityVerification = async () => {
    setStartingIdentityVerification(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-identity-session');
      
      if (error) throw error;
      
      if (data?.already_verified) {
        setIdentityVerified(true);
        toast({
          title: "Already Verified",
          description: "Your identity has already been verified.",
        });
        return;
      }
      
      if (data?.url) {
        // Try multiple redirect methods for mobile compatibility
        try {
          window.location.href = data.url;
        } catch {
          window.open(data.url, '_self');
        }
      } else {
        throw new Error('No verification URL received');
      }
    } catch (error: any) {
      console.error('Error starting identity verification:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start identity verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setStartingIdentityVerification(false);
    }
  };

  const handleStartStripeOnboarding = async () => {
    setStartingStripeOnboarding(true);
    setStripeOnboardingUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account');
      
      if (error) throw error;
      
      if (data?.onboarding_url) {
        const url = data.onboarding_url;
        setStripeOnboardingUrl(url);
        
        // Try redirect - some mobile browsers block this
        try {
          window.location.href = url;
        } catch {
          console.log('Direct redirect failed, URL stored for manual click');
        }
        
        // Give redirect a moment to work before showing fallback
        setTimeout(() => {
          // If we're still here after 2 seconds, show the manual link
          setStartingStripeOnboarding(false);
        }, 2000);
      } else {
        throw new Error('No onboarding URL received');
      }
    } catch (error: any) {
      console.error('Error starting Stripe onboarding:', error);
      setStripeOnboardingUrl(null);
      toast({
        title: "Error",
        description: error.message || "Failed to start payout setup. Please try again.",
        variant: "destructive",
      });
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

  // Determine which step the user is on
  const isLoading = identityChecking || stripeConnectChecking;
  const canSubmitClaim = identityVerified && stripeConnectComplete;

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit a claim.",
        variant: "destructive",
      });
      return;
    }

    if (!canSubmitClaim) {
      toast({
        title: "Verification required",
        description: "Please complete identity verification and payout setup before claiming bounties.",
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
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:max-w-xl overflow-hidden">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-base sm:text-lg leading-tight">
            {isEditMode ? `Edit Claim` : `Submit Claim`}
          </DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 break-words">{bountyTitle}</p>
        </DialogHeader>

        {/* Already submitted and NOT editable */}
        {hasExistingSubmission && !canEdit && !checkingExisting && (
          <Alert className="border-amber-500 bg-amber-500/10">
            <CheckCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-foreground">You've already submitted a claim</p>
                <p className="text-muted-foreground text-sm">
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
            {/* Loading state while checking requirements */}
            {isLoading && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                <AlertDescription>Checking verification status...</AlertDescription>
              </Alert>
            )}

            {/* Show verification requirements UPFRONT - both steps visible */}
            {!isLoading && !canSubmitClaim && (
              <div className="space-y-3 overflow-hidden">
                {/* Header explaining both steps are required */}
                <Alert className="border-amber-500 bg-amber-500/10">
                  <Info className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <AlertDescription className="break-words">
                    <p className="font-semibold text-foreground text-sm">Two steps required</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Complete both steps below. Takes about 5 minutes.
                    </p>
                  </AlertDescription>
                </Alert>

                {/* Step 1: Identity Verification */}
                <div className={`rounded-lg border p-3 ${identityVerified ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-primary bg-primary/5'}`}>
                  <div className="flex items-start gap-2">
                    <div className={`rounded-full p-1 flex-shrink-0 ${identityVerified ? 'bg-green-500' : 'bg-primary'}`}>
                      {identityVerified ? (
                        <CheckCircle className="h-3.5 w-3.5 text-white" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5 text-primary-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2 overflow-hidden">
                      <div>
                        <p className="font-semibold text-foreground text-sm">Step 1: Verify Your Identity</p>
                        <p className="text-muted-foreground text-xs mt-1 break-words">
                          {identityVerified 
                            ? "Identity verified! You're confirmed as a real person."
                            : "Upload a photo ID and take a quick selfie. This keeps BountyBay safe."}
                        </p>
                      </div>
                      {!identityVerified && (
                        <Button 
                          onClick={handleStartIdentityVerification} 
                          disabled={startingIdentityVerification}
                          size="sm"
                        >
                          {startingIdentityVerification ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              <span className="truncate">Opening...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="truncate">Verify Identity</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 2: Payout Setup */}
                <div className={`rounded-lg border p-3 ${stripeConnectComplete ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : identityVerified ? 'border-primary bg-primary/5' : 'border-muted bg-muted/30'}`}>
                  <div className="flex items-start gap-2">
                    <div className={`rounded-full p-1 flex-shrink-0 ${stripeConnectComplete ? 'bg-green-500' : identityVerified ? 'bg-primary' : 'bg-muted-foreground'}`}>
                      {stripeConnectComplete ? (
                        <CheckCircle className="h-3.5 w-3.5 text-white" />
                      ) : (
                        <CreditCard className="h-3.5 w-3.5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2 overflow-hidden">
                      <div>
                        <p className={`font-semibold text-sm ${!identityVerified && !stripeConnectComplete ? 'text-muted-foreground' : 'text-foreground'}`}>
                          Step 2: Set Up Payouts
                        </p>
                        <p className="text-muted-foreground text-xs mt-1 break-words">
                          {stripeConnectComplete 
                            ? "Payouts ready!"
                            : identityVerified
                              ? "Connect your bank or debit card to receive payments."
                              : "Complete Step 1 first, then set up your payout method."}
                        </p>
                      </div>
                      {!stripeConnectComplete && identityVerified && (
                        <div className="space-y-2">
                          <Button 
                            onClick={handleStartStripeOnboarding} 
                            disabled={startingStripeOnboarding}
                            size="sm"
                          >
                            {startingStripeOnboarding ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                <span className="truncate">Loading...</span>
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="truncate">Set Up Payouts</span>
                              </>
                            )}
                          </Button>
                          
                          {/* Fallback link for mobile if redirect doesn't work */}
                          {stripeOnboardingUrl && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1">Page didn't open? Tap below:</p>
                              <a 
                                href={stripeOnboardingUrl} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-primary underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Open Stripe Setup
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Both verifications complete - show success and form */}
            {!isLoading && canSubmitClaim && (
              <>
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                      <span>✓ Identity verified</span>
                      <span>✓ Payouts ready</span>
                      <span className="font-medium">— Ready to claim!</span>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Payout Breakdown */}
                {bountyAmount > 0 && (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Your Estimated Payout</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Platform fee: $2 + 5% of bounty amount. Stripe may also charge a small fee ($0.25) when you withdraw to your bank.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bounty Amount</span>
                        <span>${bountyAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Platform Fee ($2 + 5%)</span>
                        <span>-${(2 + bountyAmount * 0.05).toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-1 flex justify-between font-medium">
                        <span>You Receive</span>
                        <span className="text-green-600 dark:text-green-400">
                          ${(bountyAmount - 2 - bountyAmount * 0.05).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground pt-1">
                        *Stripe may charge ~$0.25 when you withdraw to your bank
                      </p>
                    </div>
                  </div>
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
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Info className="h-3 w-3 flex-shrink-0" />
                      <span>Tip: Describe what you found without including specific URLs here—save those for the proof section below.</span>
                    </p>
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
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveProofUrl(index)}
                            className="flex-shrink-0"
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
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add another URL
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <Label>Upload Images (Optional)</Label>
                    <p className="text-sm text-muted-foreground">
                      Upload photos as proof - these will be visible to the bounty poster
                    </p>
                    <ImageUpload
                      uploadedImages={uploadedImageDisplay}
                      onUpload={handleImageUpload}
                      onRemove={handleImageRemove}
                      maxFiles={5}
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || !message.trim()}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isEditMode ? 'Updating...' : 'Submitting...'}
                      </>
                    ) : (
                      isEditMode ? 'Update Claim' : 'Submit Claim'
                    )}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
