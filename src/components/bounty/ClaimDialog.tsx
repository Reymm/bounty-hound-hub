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
import { Plus, X, Shield } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { uploadFile } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';

interface ClaimDialogProps {
  bountyId: string;
  bountyTitle: string;
  bountyAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onClaimSubmitted: () => void;
}

export function ClaimDialog({ bountyId, bountyTitle, bountyAmount, isOpen, onClose, onClaimSubmitted }: ClaimDialogProps) {
  const [message, setMessage] = useState('');
  const [proofUrls, setProofUrls] = useState<string[]>(['']);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kycRequired, setKycRequired] = useState(false);
  const [kycChecking, setKycChecking] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if KYC is required for high-value bounties
  useEffect(() => {
    const checkKycStatus = async () => {
      // KYC required for claiming bounties over $500
      if (bountyAmount <= 500) {
        setKycRequired(false);
        return;
      }

      setKycChecking(true);
      try {
        const { data, error } = await supabase.functions.invoke('check-kyc-status');
        
        if (error) {
          console.error('Error checking KYC:', error);
          setKycRequired(true);
          return;
        }

        setKycRequired(!data?.verified);
      } catch (error) {
        console.error('Error checking KYC:', error);
        setKycRequired(true);
      } finally {
        setKycChecking(false);
      }
    };

    if (isOpen && user) {
      checkKycStatus();
    }
  }, [isOpen, user, bountyAmount]);

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
      
      const successfulUploads = uploadResults
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
      
      if (successfulUploads.length > 0) {
        const newImages = [...uploadedImages, ...successfulUploads];
        setUploadedImages(newImages);
        
        toast({
          title: "Images uploaded",
          description: `${successfulUploads.length} image(s) uploaded successfully.`,
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

  const handleImageRemove = async (imageUrl: string) => {
    const newImages = uploadedImages.filter(img => img !== imageUrl);
    setUploadedImages(newImages);
  };

  const handleStartKyc = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-kyc-verification');
      
      if (error) throw error;
      
      if (data?.verification_url) {
        window.location.href = data.verification_url;
      }
    } catch (error: any) {
      toast({
        title: "Verification error",
        description: error.message || "Failed to start verification",
        variant: "destructive",
      });
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

    if (kycRequired) {
      toast({
        title: "Verification required",
        description: "Please complete identity verification before claiming this bounty.",
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
        proofImages: uploadedImages // This should be URLs, not File objects
      });

      toast({
        title: "Claim submitted successfully!",
        description: "The bounty poster will review your submission.",
        variant: "default",
      });

      // Reset form
      setMessage('');
      setProofUrls(['']);
      setUploadedImages([]);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Claim for "{bountyTitle}"</DialogTitle>
        </DialogHeader>

        {kycRequired && (
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
            <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <div className="space-y-2">
                <p className="font-semibold">Identity Verification Required</p>
                <p>Bounties over $200 require identity verification before claiming. This helps protect both hunters and posters.</p>
                <Button 
                  onClick={handleStartKyc} 
                  variant="outline" 
                  className="mt-2 border-amber-600 text-amber-700 hover:bg-amber-100"
                  disabled={kycChecking}
                >
                  {kycChecking ? 'Checking...' : 'Start Verification'}
                </Button>
              </div>
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
              uploadedImages={uploadedImages}
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
              disabled={isSubmitting || kycRequired || kycChecking}
            >
              {isSubmitting ? 'Submitting...' : kycRequired ? 'Verification Required' : 'Submit Claim'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}