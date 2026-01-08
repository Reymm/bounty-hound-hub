import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, DollarSign, MapPin, Upload, X, Plus, AlertCircle, CreditCard, Shield, Package, Target } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { postBountySchema, PostBountyFormData } from '@/lib/validators';
import { BountyCategory, CATEGORY_STRUCTURE } from '@/lib/types';
import { mockApi } from '@/lib/api/mock';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile, deleteFile } from '@/lib/storage';
import { ImageUpload } from '@/components/ui/image-upload';
import { LocationPicker } from '@/components/ui/location-picker';
import { useAuth } from '@/contexts/AuthContext';
import { MilestoneCreator } from '@/components/bounty/MilestoneCreator';
import { Switch } from '@/components/ui/switch';

const stripePromise = loadStripe('pk_test_51JXDu0HQ9JaJlRZTdf0Wq0nc9nu5J0JIAOybThyevrFElUBRyoK8wxE9Ew3a36wg4q1BmZj6eHGhiA2llvhi77lh00xgJCfwH9');

export default function PostBounty() {
  return (
    <Elements stripe={stripePromise}>
      <PostBountyForm />
    </Elements>
  );
}

function PostBountyForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'details' | 'kyc' | 'payment' | 'processing'>('details');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [escrowId, setEscrowId] = useState<string | null>(null);
  const [kycRequired, setKycRequired] = useState(false);
  const [kycStatus, setKycStatus] = useState<'not_started' | 'pending' | 'verified' | 'failed'>('not_started');
  const [kycVerificationUrl, setKycVerificationUrl] = useState<string | null>(null);
  const [platformFee, setPlatformFee] = useState(0);
  const [totalCharge, setTotalCharge] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [verificationRequirements, setVerificationRequirements] = useState<string[]>(['']);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [hasDeadline, setHasDeadline] = useState(false);
  const [bountyType, setBountyType] = useState<'lead-only' | 'item-delivery' | 'purchase-delivery'>('lead-only');

  // Derive requiresShipping and hunterPurchasesItem from bountyType
  const requiresShipping = bountyType === 'item-delivery' || bountyType === 'purchase-delivery';
  const hunterPurchasesItem = bountyType === 'purchase-delivery';
  const [useMilestones, setUseMilestones] = useState(false);
  const [milestones, setMilestones] = useState<Array<{id: string, title: string, description: string, amount: number}>>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
    getValues
  } = useForm<PostBountyFormData>({
    resolver: zodResolver(postBountySchema),
    defaultValues: {
      tags: [],
      verificationRequirements: [''],
      deadline: undefined,
      category: undefined // Explicitly set to undefined
    }
  });

  const watchedBountyAmount = watch('bountyAmount');
  const watchedTargetMin = watch('targetPriceMin');
  const watchedTargetMax = watch('targetPriceMax');
  const selectedCategory = watch('category');

  // Load saved form data on mount
  useEffect(() => {
    const savedData = sessionStorage.getItem('bounty_draft');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Restore form fields
        Object.keys(parsed.formData).forEach(key => {
          if (key === 'deadline') {
            setValue(key as any, new Date(parsed.formData[key]));
          } else {
            setValue(key as any, parsed.formData[key], { shouldValidate: true });
          }
        });
        // Restore other state
        if (parsed.tags) setTags(parsed.tags);
        if (parsed.verificationRequirements) setVerificationRequirements(parsed.verificationRequirements);
        if (parsed.uploadedImages) setUploadedImages(parsed.uploadedImages);
        if (parsed.hasDeadline !== undefined) setHasDeadline(parsed.hasDeadline);
        
        toast({
          title: "Draft restored",
          description: "Your previous bounty draft has been loaded.",
        });
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  // Auto-save draft as user types (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const formData = getValues();
      // Only save if there's actual content
      if (formData.title || formData.description || tags.length > 0) {
        sessionStorage.setItem('bounty_draft', JSON.stringify({
          formData,
          tags,
          verificationRequirements,
          uploadedImages,
          hasDeadline
        }));
      }
    }, 1000); // Save 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [watch(), tags, verificationRequirements, uploadedImages, hasDeadline]);

  // Calculate fees when bounty amount changes
  useEffect(() => {
    if (watchedBountyAmount && !isNaN(watchedBountyAmount) && watchedBountyAmount > 0) {
      // No platform fee for poster - only Stripe processing fees
      // Stripe fee: 2.9% + $0.30, added ON TOP of the bounty amount
      // If user enters $50 bounty, hunter gets $50, user pays $50 + fees
      const stripeFee = Math.round((watchedBountyAmount * 0.029 + 0.30) * 100) / 100;
      const total = Math.round((watchedBountyAmount + stripeFee) * 100) / 100;
      
      setPlatformFee(stripeFee); // Store stripe fee for display
      setTotalCharge(total);
      // KYC required for bounties over $1000
      setKycRequired(watchedBountyAmount > 1000);
    } else {
      setPlatformFee(0);
      setTotalCharge(0);
      setKycRequired(false);
    }
  }, [watchedBountyAmount]);

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 10) {
      const newTags = [...tags, currentTag.trim()];
      setTags(newTags);
      setValue('tags', newTags);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    setValue('tags', newTags);
  };

  const addVerificationRequirement = () => {
    if (verificationRequirements.length < 10) {
      const newRequirements = [...verificationRequirements, ''];
      setVerificationRequirements(newRequirements);
    }
  };

  const updateVerificationRequirement = (index: number, value: string) => {
    const newRequirements = [...verificationRequirements];
    newRequirements[index] = value;
    setVerificationRequirements(newRequirements);
    setValue('verificationRequirements', newRequirements.filter(req => req.trim()));
  };

  const removeVerificationRequirement = (index: number) => {
    if (verificationRequirements.length > 1) {
      const newRequirements = verificationRequirements.filter((_, i) => i !== index);
      setVerificationRequirements(newRequirements);
      setValue('verificationRequirements', newRequirements.filter(req => req.trim()));
    }
  };

  const handleImageUpload = async (files: File[], onProgress?: (fileName: string, progress: number) => void) => {
    console.log('handleImageUpload called with files:', files);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user:', user, 'Error:', userError);
      
      if (!user) {
        throw new Error('You must be logged in to upload images. Please sign in and try again.');
      }

      console.log('Starting upload for', files.length, 'files');
      const uploadPromises = files.map(file => 
        uploadFile(file, 'bounty-images', user.id, undefined, (progress) => {
          onProgress?.(file.name, progress);
        })
      );
      const uploadResults = await Promise.all(uploadPromises);
      console.log('Upload results:', uploadResults);
      
      const successfulUploads = uploadResults
        .filter(result => !result.error && result.url)
        .map(result => result.url!);
      
      const failedUploads = uploadResults.filter(result => result.error);
      
      if (failedUploads.length > 0) {
        console.error('Failed uploads:', failedUploads);
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
        // Use functional update to avoid race conditions with multiple uploads
        setUploadedImages(prev => {
          const newImages = [...prev, ...successfulUploads];
          setValue('images', newImages);
          return newImages;
        });
        
        toast({
          title: "Images uploaded",
          description: `${successfulUploads.length} image(s) uploaded successfully.`,
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImageRemove = async (imageUrl: string) => {
    try {
      // Extract file path from URL - for public URLs, we need the path after the bucket name
      const urlParts = imageUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'bounty-images');
      if (bucketIndex === -1) {
        throw new Error('Invalid image URL format');
      }
      
      const filePath = urlParts.slice(bucketIndex + 1).join('/');
      const result = await deleteFile('bounty-images', filePath);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      const newImages = uploadedImages.filter(img => img !== imageUrl);
      setUploadedImages(newImages);
      setValue('images', newImages);
      
      toast({
        title: "Image removed",
        description: "Image has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Remove failed", 
        description: error.message || "Failed to remove image",
        variant: "destructive",
      });
    }
  };

  const onDetailsSubmit = async (data: PostBountyFormData) => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!data.category) {
        toast({
          title: "Missing category",
          description: "Please select a category for your bounty.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Set flag that user is in bounty posting process
      sessionStorage.setItem('bounty_post_in_progress', 'true');
      
      // Save draft to sessionStorage
      sessionStorage.setItem('bounty_draft', JSON.stringify({
        formData: data,
        tags,
        verificationRequirements,
        uploadedImages,
        hasDeadline
      }));
      
      // ALWAYS run content moderation check - even if user went back to edit
      toast({
        title: "Checking content",
        description: "Verifying your bounty meets community guidelines...",
      });
      
      const { data: moderationData, error: moderationError } = await supabase.functions.invoke('moderate-content', {
        body: {
          title: data.title,
          description: data.description,
          tags: tags
        }
      });
      
      if (moderationError) throw moderationError;
      
      if (!moderationData.allowed) {
        toast({
          title: "Content not allowed",
          description: moderationData.message || "Your bounty content violates community guidelines. Please revise and try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // If we already have a payment intent (user went back to edit), 
      // just go back to payment without creating a new one
      if (clientSecret && paymentIntentId) {
        setCurrentStep('payment');
        setIsSubmitting(false);
        return;
      }
      
      // Check if KYC is required and user is verified
      if (kycRequired) {
        const { data: kycData, error: kycError } = await supabase.functions.invoke('check-kyc-status');
        
        if (kycError) throw kycError;
        
        if (!kycData.verified) {
          setKycStatus(kycData.status);
          setCurrentStep('kyc');
          return;
        }
      }
      
      // Proceed to payment
      const { data: paymentData, error } = await supabase.functions.invoke('create-escrow-payment', {
        body: {
          amount: data.bountyAmount,
          currency: 'usd'
        }
      });

      if (error) throw error;

      setPaymentIntentId(paymentData.payment_intent_id);
      setClientSecret(paymentData.client_secret);
      setEscrowId(paymentData.escrow_id);
      setPlatformFee(paymentData.platform_fee);
      setTotalCharge(paymentData.total_charge);
      setCurrentStep('payment');
      
      toast({
        title: "Payment created",
        description: `Please complete your payment of $${paymentData.total_charge} (includes $${paymentData.platform_fee} platform fee).`,
      });

    } catch (error: any) {
      console.error('Error in bounty submission:', error);
      toast({
        title: "Submission error",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKycVerification = async () => {
    try {
      setIsSubmitting(true);
      
      const { data: kycData, error } = await supabase.functions.invoke('create-kyc-verification');
      
      if (error) throw error;
      
      if (kycData.status === 'already_verified') {
        setKycStatus('verified');
        // Continue to payment step
        const formData = getValues();
        await onDetailsSubmit(formData);
        return;
      }
      
      setKycVerificationUrl(kycData.verification_url);
      setKycStatus('pending');
      
      // Open KYC verification in new tab
      window.open(kycData.verification_url, '_blank');
      
      toast({
        title: "Identity verification required",
        description: "Please complete your identity verification in the new tab, then return here.",
      });
      
    } catch (error: any) {
      console.error('Error creating KYC verification:', error);
      toast({
        title: "Error starting verification",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkKycStatus = async () => {
    try {
      const { data: kycData, error } = await supabase.functions.invoke('check-kyc-status');
      
      if (error) throw error;
      
      setKycStatus(kycData.status);
      
      if (kycData.verified) {
        toast({
          title: "Identity verified!",
          description: "You can now proceed with posting your bounty.",
        });
        // Continue to payment step
        const formData = getValues();
        await onDetailsSubmit(formData);
      }
      
    } catch (error: any) {
      console.error('Error checking KYC status:', error);
    }
  };

  const handlePaymentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      return;
    }

    // Get CardNumberElement reference BEFORE any state changes
    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      toast({
        title: "Payment Error",
        description: "Payment form not ready. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    // Disable form inputs but don't unmount anything
    setIsPaymentProcessing(true);

    try {
      // Use the cardNumberElement reference we got before state changes
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
        }
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      // Only change to processing step after payment is confirmed
      setCurrentStep('processing');

      if (paymentIntent.status === 'requires_capture') {
        // Payment successful, create bounty
        const formData = getValues();
        const { data: bountyData, error: bountyError } = await supabase.functions.invoke('confirm-escrow-and-create-bounty', {
          body: {
            payment_intent_id: paymentIntent.id,
            bounty_data: {
              title: formData.title,
              description: formData.description,
              category: formData.category,
              subcategory: formData.subcategory,  
              location: formData.location,
              deadline: hasDeadline ? formData.deadline : null,
              targetPriceMin: formData.targetPriceMin,
              targetPriceMax: formData.targetPriceMax,
              tags,
              verificationRequirements: verificationRequirements.filter(req => req.trim()),
              images: uploadedImages,
              requires_shipping: requiresShipping,
              hunter_purchases_item: hunterPurchasesItem,
              has_milestones: useMilestones,
              milestone_data: useMilestones ? milestones : null
            }
          }
        });

        if (bountyError) throw bountyError;

        // Send confirmation email
        try {
          await supabase.functions.invoke('send-bounty-confirmation', {
            body: {
              email: user?.email,
              bountyTitle: formData.title,
              bountyAmount: watchedBountyAmount,
              bountyId: bountyData.bounty_id,
              posterName: user?.user_metadata?.full_name || user?.email?.split('@')[0]
            }
          });
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Don't fail the bounty posting if email fails
        }

        toast({
          title: "Bounty posted successfully!",
          description: "Your bounty is now live with funds secured in escrow.",
        });

        // Clear the bounty posting flag and draft
        sessionStorage.removeItem('bounty_post_in_progress');
        sessionStorage.removeItem('bounty_draft');

        navigate(`/b/${bountyData.bounty_id}`);
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      setCurrentStep('payment');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  if (currentStep === 'kyc') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Identity Verification Required</h1>
          <p className="text-muted-foreground">
            Bounties over $50 require identity verification for security purposes.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              KYC Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                This verification process is secure, compliant, and protects all users on the platform.
              </AlertDescription>
            </Alert>

            {kycStatus === 'not_started' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To post bounties over $50, please verify your identity using a government-issued ID.
                </p>
                <Button onClick={handleKycVerification} disabled={isSubmitting}>
                  {isSubmitting ? 'Starting Verification...' : 'Start Identity Verification'}
                </Button>
              </div>
            )}

            {kycStatus === 'pending' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Please complete your identity verification in the new tab, then check the status below.
                </p>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={checkKycStatus}>
                    Check Verification Status
                  </Button>
                  {kycVerificationUrl && (
                    <Button variant="outline" onClick={() => window.open(kycVerificationUrl, '_blank')}>
                      Open Verification Page
                    </Button>
                  )}
                </div>
              </div>
            )}

            {kycStatus === 'failed' && (
              <div className="space-y-4">
                <p className="text-sm text-destructive">
                  Verification failed. Please try again or contact support if the issue persists.
                </p>
                <Button onClick={handleKycVerification} disabled={isSubmitting}>
                  Retry Verification
                </Button>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep('details')}
              >
                Back to Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'payment') {
    const stripeFee = totalCharge - watchedBountyAmount - platformFee;
    
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Verify Your Payment Method</h1>
          <p className="text-muted-foreground">
            We'll save your card securely. You're only charged when you approve a submission.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Bounty: ${watchedBountyAmount?.toFixed(2) || '0.00'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Escrow Explanation */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>No charge today:</strong> We verify and securely save your card. You're only charged when you approve a hunter's submission. If no one claims your bounty, you pay nothing.
              </AlertDescription>
            </Alert>

            {/* Payment Breakdown */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">When You Approve a Submission</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bounty reward to hunter:</span>
                  <span className="font-medium">${watchedBountyAmount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment processing (Stripe):</span>
                  <span>${(totalCharge - (watchedBountyAmount || 0)).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total (charged on approval):</span>
                  <span>${totalCharge.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                No platform fees for posters. Hunters pay a $2 + 5% fee when paid out.
              </p>
            </div>

            {/* How it Works */}
            <div className="space-y-3 text-sm">
              <h4 className="font-medium">How it works:</h4>
              <ol className="space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">1.</span>
                  <span>We verify and securely save your card (no charge)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">2.</span>
                  <span>Your bounty goes live for hunters to find</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">3.</span>
                  <span>Hunter finds your item and submits proof</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">4.</span>
                  <span>You review and approve (or reject) the submission</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">5.</span>
                  <span>Only then: ${totalCharge.toFixed(2)} charged, ${watchedBountyAmount?.toFixed(2) || '0.00'} goes to hunter</span>
                </li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                💡 If your bounty expires with no claims, or you cancel, you pay nothing.
              </p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              <div className="space-y-4">
                <Label className="flex items-center justify-between">
                  <span>Payment Method</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Powered by{' '}
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" 
                      alt="Stripe" 
                      className="inline h-3 ml-1"
                    />
                  </span>
                </Label>
                
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <div className="p-3 border rounded-md bg-background">
                    <CardNumberElement options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': {
                            color: '#aab7c4',
                          },
                        },
                      },
                    }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiry">Expiry Date</Label>
                    <div className="p-3 border rounded-md bg-background">
                      <CardExpiryElement options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': {
                              color: '#aab7c4',
                            },
                          },
                        },
                      }} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cardCvc">CVC</Label>
                    <div className="p-3 border rounded-md bg-background">
                      <CardCvcElement options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': {
                              color: '#aab7c4',
                            },
                          },
                        },
                      }} />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  🔒 Your payment information is encrypted and secure. We never store your card details.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep('details')}
                  disabled={isPaymentProcessing}
                >
                  Back to Details
                </Button>
                <Button 
                  type="submit" 
                  disabled={!stripe || !elements || isPaymentProcessing}
                  className="flex-1 bg-primary hover:bg-primary-hover"
                >
                  {isPaymentProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Save Card & Post Bounty
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            No Stripe account needed for posters. Hunters will set up their own accounts to receive payments.
          </p>
        </div>
      </div>
    );
  }

  if (currentStep === 'processing') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">Processing Your Bounty</h2>
          <p className="text-muted-foreground">Please wait while we secure your funds and create your bounty...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Post a Bounty</h1>
        <p className="text-muted-foreground">
          Tell our community what you're looking for and set a bounty for successful finds.
        </p>
      </div>

      <form onSubmit={handleSubmit(onDetailsSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="What are you looking for? Be specific..."
                spellCheck={true}
                {...register('title')}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about what you're looking for, including specifications, condition requirements, and any other important details..."
                rows={6}
                spellCheck={true}
                {...register('description')}
                className={errors.description ? 'border-destructive' : ''}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setValue('subcategory', undefined); // Clear subcategory when category changes
                      }}
                      value={field.value}
                    >
                      <SelectTrigger id="category" className={errors.category ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_STRUCTURE).map(([key, categoryData]) => (
                          <SelectItem key={key} value={key}>
                            {categoryData.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>

              {/* Subcategory - Only show if category is selected */}
              {selectedCategory && (
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Controller
                    name="subcategory"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="subcategory">
                          <SelectValue placeholder="Select a subcategory (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORY_STRUCTURE[selectedCategory]?.subcategories || {}).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Your Location <span className="text-destructive">*</span>
              </label>
              <LocationPicker
                value={watch('location')}
                onChange={(location) => setValue('location', location)}
                placeholder="Search for your city, state or region..."
                className={errors.location ? 'border-destructive' : ''}
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Where are you located? Hunters will provide leads on where to find your item, or may source and ship it directly to you.
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-sm">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tags (press Enter or click Add)"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  disabled={tags.length >= 10}
                />
                <Button
                  type="button"
                  onClick={addTag}
                  disabled={!currentTag.trim() || tags.length >= 10 || tags.includes(currentTag.trim())}
                  variant="outline"
                >
                  Add
                </Button>
              </div>
              {errors.tags && (
                <p className="text-sm text-destructive">{errors.tags.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Add up to 10 relevant tags to help hunters find your bounty
              </p>
            </div>

            {/* Bounty Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">What do you need from the hunter?</Label>
              
              {/* Option 1: Lead Only */}
              <div 
                className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  bountyType === 'lead-only' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-muted/30 hover:border-muted-foreground/50'
                }`}
                onClick={() => setBountyType('lead-only')}
              >
                <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  bountyType === 'lead-only' ? 'border-primary' : 'border-muted-foreground'
                }`}>
                  {bountyType === 'lead-only' && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 font-medium">
                    <Target className="h-4 w-4" />
                    <span>Lead Only</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hunter tells you where to find the item (e.g., "Found it at a thrift shop in Cincinnati"). You'll handle getting it yourself.
                  </p>
                </div>
              </div>

              {/* Option 2: Item Delivery */}
              <div 
                className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  bountyType === 'item-delivery' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-muted/30 hover:border-muted-foreground/50'
                }`}
                onClick={() => setBountyType('item-delivery')}
              >
                <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  bountyType === 'item-delivery' ? 'border-primary' : 'border-muted-foreground'
                }`}>
                  {bountyType === 'item-delivery' && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 font-medium">
                    <Package className="h-4 w-4" />
                    <span>Item Delivery</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hunter already has the item and will ship it directly to you. You'll provide your shipping address after accepting their submission.
                  </p>
                </div>
              </div>

              {/* Option 3: Purchase & Delivery */}
              <div 
                className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  bountyType === 'purchase-delivery' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-muted/30 hover:border-muted-foreground/50'
                }`}
                onClick={() => setBountyType('purchase-delivery')}
              >
                <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  bountyType === 'purchase-delivery' ? 'border-primary' : 'border-muted-foreground'
                }`}>
                  {bountyType === 'purchase-delivery' && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 font-medium">
                    <DollarSign className="h-4 w-4" />
                    <span>Purchase & Delivery</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hunter finds, purchases, and ships the item to you. After approving their submission, you'll send purchase funds securely through our platform.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>How pricing works:</strong> The bounty reward is your finder's fee for locating the item. The target price is what you'll pay for the item itself. The finder's fee is held in escrow now. If the hunter purchases the item for you, you'll send those funds securely through our platform after approving their submission.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="bountyAmount">
                Bounty Reward (Finder's Fee) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="bountyAmount"
                  type="number"
                  min="5"
                  max="10000"
                  placeholder="500"
                  className={`pl-10 ${errors.bountyAmount || (watchedBountyAmount && watchedBountyAmount < 5) ? 'border-destructive' : ''}`}
                  {...register('bountyAmount', { 
                    valueAsNumber: true,
                    setValueAs: (v) => v === '' ? undefined : parseFloat(v)
                  })}
                />
              </div>
              {errors.bountyAmount && (
                <p className="text-sm text-destructive">{errors.bountyAmount.message}</p>
              )}
              {!errors.bountyAmount && typeof watchedBountyAmount === 'number' && !isNaN(watchedBountyAmount) && watchedBountyAmount < 5 && (
                <p className="text-sm text-destructive">Minimum bounty must be $5</p>
              )}
              <p className="text-xs text-muted-foreground">
                💰 This is your reward to the hunter for <strong>finding</strong> the item - not the item's purchase price ($5 - $10,000)
              </p>
            </div>

            {/* Fee Breakdown */}
            {watchedBountyAmount > 0 && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium">Finder's Fee Payment Breakdown</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Bounty Reward (Finder's Fee):</span>
                    <span className="font-medium">${watchedBountyAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Payment Processing (Stripe):</span>
                    <span>${platformFee.toFixed(2)}</span>
                  </div>
                  {kycRequired && (
                    <div className="flex justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
                      <span>⚠️ Identity Verification Required:</span>
                      <span>Bounty {'>'} $1,000</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold text-base">
                    <span>Total Charge:</span>
                    <span>${totalCharge.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  💰 No platform fees for posters. Hunters pay $2 + 5% when paid out. If hunter purchases the item, you'll send those funds securely after approval.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetPriceMin">Target Price Range (Optional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="targetPriceMin"
                      type="number"
                      min="1"
                      placeholder="Min price"
                      className={`pl-10 ${errors.targetPriceMin ? 'border-destructive' : ''}`}
                      {...register('targetPriceMin', { 
                        setValueAs: (value) => value === '' ? undefined : parseInt(value, 10)
                      })}
                    />
                  </div>
                  {errors.targetPriceMin && (
                    <p className="text-sm text-destructive">{errors.targetPriceMin.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetPriceMax">&nbsp;</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="targetPriceMax"
                      type="number"
                      min="1"
                      placeholder="Max price"
                      className={`pl-10 ${errors.targetPriceMax ? 'border-destructive' : ''}`}
                      {...register('targetPriceMax', { 
                        setValueAs: (value) => value === '' ? undefined : parseInt(value, 10)
                      })}
                    />
                  </div>
                  {errors.targetPriceMax && (
                    <p className="text-sm text-destructive">{errors.targetPriceMax.message}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                🏷️ This is what you're willing to pay for the <strong>item itself</strong> (separate from the finder's fee above)
              </p>
            </div>

            {watchedTargetMin && watchedTargetMax && watchedTargetMin > watchedTargetMax && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Minimum price cannot be greater than maximum price
                </AlertDescription>
              </Alert>
            )}

            {/* Milestone Support */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="useMilestones" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>Split into Milestones</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Break the bounty into phases with separate payments
                  </p>
                </div>
                <Switch
                  id="useMilestones"
                  checked={useMilestones}
                  onCheckedChange={setUseMilestones}
                />
              </div>

              {useMilestones && (
                <MilestoneCreator
                  totalBountyAmount={watchedBountyAmount || 0}
                  milestones={milestones}
                  onChange={setMilestones}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timeline & Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline & Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="has-deadline"
                  checked={hasDeadline}
                  onChange={(e) => {
                    setHasDeadline(e.target.checked);
                    if (!e.target.checked) {
                      setValue('deadline', undefined as any);
                    } else {
                      setValue('deadline', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
                    }
                  }}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="has-deadline" className="text-sm font-normal cursor-pointer">
                  Set a deadline for this bounty
                </Label>
              </div>
              
              {hasDeadline && (
                <div className="space-y-2">
                  <Label htmlFor="deadline">
                    Deadline <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className={errors.deadline ? 'border-destructive' : ''}
                    {...register('deadline', { 
                      valueAsDate: true,
                      setValueAs: (value) => value ? new Date(value) : undefined
                    })}
                  />
                  {errors.deadline && (
                    <p className="text-sm text-destructive">{errors.deadline.message}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Verification Requirements <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Specify what hunters need to provide as proof of finding your item
              </p>
              
              <div className="space-y-2">
                {verificationRequirements.map((requirement, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Requirement ${index + 1} (e.g., "High-quality photos from multiple angles")`}
                      value={requirement}
                      onChange={(e) => updateVerificationRequirement(index, e.target.value)}
                    />
                    {verificationRequirements.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVerificationRequirement(index)}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {verificationRequirements.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVerificationRequirement}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              )}

              {errors.verificationRequirements && (
                <p className="text-sm text-destructive">{errors.verificationRequirements.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Images (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              uploadedImages={uploadedImages}
              maxFiles={5}
              maxSize={10 * 1024 * 1024} // 10MB
            />
            <p className="text-xs text-muted-foreground mt-2">
              Upload up to 5 reference images to help hunters understand what you're looking for
            </p>
          </CardContent>
        </Card>

        {/* Validation Summary */}
        {(() => {
          const missingFields: string[] = [];
          if (!watch('title')?.trim()) missingFields.push('Title');
          if (!watch('description')?.trim()) missingFields.push('Description');
          if (!watch('category')) missingFields.push('Category');
          if (!watchedBountyAmount) missingFields.push('Bounty amount');
          else if (watchedBountyAmount < 5) missingFields.push('Bounty amount (min $5)');
          else if (watchedBountyAmount > 10000) missingFields.push('Bounty amount (max $10,000)');
          if (!watch('location')?.trim()) missingFields.push('Location');
          if ((watch('tags') || []).length === 0) missingFields.push('At least one tag');
          if (verificationRequirements.filter(r => r.trim()).length === 0) missingFields.push('At least one verification requirement');
          
          if (missingFields.length > 0) {
            return (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Please complete the following:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {missingFields.map((field, i) => (
                      <li key={i}>{field}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            );
          }
          return null;
        })()}

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={
              isSubmitting || 
              !watch('title')?.trim() ||
              !watch('description')?.trim() ||
              !watch('category') ||
              !watchedBountyAmount || 
              watchedBountyAmount < 5 || 
              watchedBountyAmount > 10000 ||
              !watch('location')?.trim() ||
              (watch('tags') || []).length === 0 ||
              verificationRequirements.filter(r => r.trim()).length === 0
            }
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            {isSubmitting ? 'Creating Payment...' : `Continue to ${kycRequired ? 'Verification' : 'Payment'} ${totalCharge > 0 ? `($${totalCharge} total)` : watchedBountyAmount ? `($${watchedBountyAmount})` : ''}`}
          </Button>
        </div>
      </form>
    </div>
  );
}