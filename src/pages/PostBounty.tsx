import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, DollarSign, MapPin, Upload, X, Plus, AlertCircle, CreditCard, Shield } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

const stripePromise = loadStripe('pk_test_51QfOrlJBfkPjzFmqPq7zLJhSaKnE7Nf7HRdBK9GR0OHfhE6AEHwAJDKt8H0XhHyPzOBGQrj6hVRQNj6YGFmHxC300g4kxUEfr');

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
  const [hasDeadline, setHasDeadline] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues
  } = useForm<PostBountyFormData>({
    resolver: zodResolver(postBountySchema),
    defaultValues: {
      tags: [],
      verificationRequirements: [''],
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
  });

  const watchedBountyAmount = watch('bountyAmount');
  const watchedTargetMin = watch('targetPriceMin');
  const watchedTargetMax = watch('targetPriceMax');
  const selectedCategory = watch('category');

  // Calculate fees when bounty amount changes
  useEffect(() => {
    if (watchedBountyAmount) {
      const fee = Math.round(watchedBountyAmount * 0.035 * 100) / 100;
      const total = watchedBountyAmount + fee;
      setPlatformFee(fee);
      setTotalCharge(total);
      setKycRequired(watchedBountyAmount > 50);
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

  const handleImageUpload = async (files: File[]) => {
    console.log('handleImageUpload called with files:', files);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user:', user, 'Error:', userError);
      
      if (!user) {
        throw new Error('You must be logged in to upload images. Please sign in and try again.');
      }

      console.log('Starting upload for', files.length, 'files');
      const uploadPromises = files.map(file => uploadFile(file, 'bounty-images', user.id));
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
        const newImages = [...uploadedImages, ...successfulUploads];
        setUploadedImages(newImages);
        setValue('images', newImages);
        
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
      
      // Set flag that user is in bounty posting process
      sessionStorage.setItem('bounty_post_in_progress', 'true');
      
      // Content moderation check
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

    setIsPaymentProcessing(true);
    setCurrentStep('processing');

    try {
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

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
              deadline: formData.deadline,
              targetPriceMin: formData.targetPriceMin,
              targetPriceMax: formData.targetPriceMax,
              tags,
              verificationRequirements: verificationRequirements.filter(req => req.trim()),
              images: uploadedImages
            }
          }
        });

        if (bountyError) throw bountyError;

        toast({
          title: "Bounty posted successfully!",
          description: "Your bounty is now live with funds secured in escrow.",
        });

        // Clear the bounty posting flag
        sessionStorage.removeItem('bounty_post_in_progress');

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
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Secure Your Bounty</h1>
          <p className="text-muted-foreground">
            Complete your escrow payment to post your bounty with funds secured.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Escrow Payment - ${totalCharge}
              {platformFee > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (${watchedBountyAmount} bounty + ${platformFee} fee)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your payment will be held securely in escrow until you approve the successful hunter's claim.
              </AlertDescription>
            </Alert>

            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="p-4 border rounded-md">
                  <CardElement options={{
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
                  className="flex-1"
                >
                  {isPaymentProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Secure ${totalCharge} in Escrow
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
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
                <Select onValueChange={(value) => {
                  setValue('category', value as BountyCategory);
                  setValue('subcategory', undefined); // Clear subcategory when category changes
                }}>
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
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>

              {/* Subcategory - Only show if category is selected */}
              {selectedCategory && (
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Select onValueChange={(value) => setValue('subcategory', value)}>
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
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Location <span className="text-destructive">*</span>
              </label>
              <LocationPicker
                value={watch('location')}
                onChange={(location) => setValue('location', location)}
                placeholder="Search for a city, state or region..."
                className={errors.location ? 'border-destructive' : ''}
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Where should hunters look or deliver the item? You can search or click on the map to select a location.
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
                To ensure trust and security, bounty funds must be deposited in escrow before posting. 
                This guarantees payment to successful hunters and protects both parties.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="bountyAmount">
                Bounty Amount <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="bountyAmount"
                  type="number"
                  min="5"
                  max="10000"
                  placeholder="500"
                  className={`pl-10 ${errors.bountyAmount ? 'border-destructive' : ''}`}
                  {...register('bountyAmount', { valueAsNumber: true })}
                />
              </div>
              {errors.bountyAmount && (
                <p className="text-sm text-destructive">{errors.bountyAmount.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Amount to reward the successful hunter ($5 - $10,000)
              </p>
            </div>

            {/* Fee Breakdown */}
            {platformFee > 0 && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium">Payment Breakdown</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Bounty Amount:</span>
                    <span>${watchedBountyAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee (3.5%):</span>
                    <span>${platformFee}</span>
                  </div>
                  {kycRequired && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>KYC Required:</span>
                      <span>Bounty {'>'}$50</span>
                    </div>
                  )}
                  <div className="border-t pt-1 flex justify-between font-medium">
                    <span>Total Charge:</span>
                    <span>${totalCharge}</span>
                  </div>
                </div>
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
                This is what you're willing to pay for the item you're looking for (separate from the bounty reward)
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
                  id="no-deadline"
                  checked={!hasDeadline}
                  onChange={(e) => {
                    setHasDeadline(!e.target.checked);
                    if (e.target.checked) {
                      setValue('deadline', undefined as any);
                    } else {
                      setValue('deadline', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
                    }
                  }}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="no-deadline" className="text-sm font-normal cursor-pointer">
                  No deadline - open until found
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
              maxSize={5 * 1024 * 1024} // 5MB
            />
            <p className="text-xs text-muted-foreground mt-2">
              Upload up to 5 reference images to help hunters understand what you're looking for
            </p>
          </CardContent>
        </Card>

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
            disabled={isSubmitting || !watchedBountyAmount || watchedBountyAmount < 5 || watchedBountyAmount > 10000}
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            {isSubmitting ? 'Creating Payment...' : `Continue to ${kycRequired ? 'Verification' : 'Payment'} ${totalCharge > 0 ? `($${totalCharge} total)` : watchedBountyAmount ? `($${watchedBountyAmount})` : ''}`}
          </Button>
        </div>
      </form>
    </div>
  );
}