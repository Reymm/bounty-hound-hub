import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, DollarSign, MapPin, Upload, X, Plus, AlertCircle, CreditCard, Shield, Package } from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState<'details' | 'payment' | 'processing'>('details');
  const [setupIntentId, setSetupIntentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [escrowId, setEscrowId] = useState<string | null>(null);
  const [platformFee, setPlatformFee] = useState(0);
  const [totalCharge, setTotalCharge] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [verificationRequirements, setVerificationRequirements] = useState<string[]>([]);
  const [currentRequirement, setCurrentRequirement] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [hasDeadline, setHasDeadline] = useState(false);
  const [bountyType, setBountyType] = useState<'lead-only' | 'find-and-ship'>('lead-only');
  const [adultConfirmed, setAdultConfirmed] = useState(false);

  // Derive requiresShipping and hunterPurchasesItem from bountyType
  // Find & Ship = shipping ON + hunter purchases ON (bundled together)
  const requiresShipping = bountyType === 'find-and-ship';
  const hunterPurchasesItem = bountyType === 'find-and-ship';

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

  // Track if draft has already been loaded (prevents overwrites)
  const draftLoadedRef = useRef(false);

  // Load saved form data ONCE on mount only
  useEffect(() => {
    if (draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    
    const savedData = sessionStorage.getItem('bounty_draft');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Restore form fields - use shouldValidate: false to prevent side effects
        Object.keys(parsed.formData).forEach(key => {
          if (key === 'deadline') {
            setValue(key as any, new Date(parsed.formData[key]), { shouldValidate: false });
          } else {
            setValue(key as any, parsed.formData[key], { shouldValidate: false });
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

  // FEE CALCULATION v2 - 3.7% + $0.30 - UPDATED JAN 14 2026
  // Calculate fees when bounty amount changes
  // With save-card model, we don't charge upfront - just save the card
  // But we show poster what they'll pay on approval (bounty + Stripe processing fee)
  useEffect(() => {
    if (watchedBountyAmount && !isNaN(watchedBountyAmount) && watchedBountyAmount > 0) {
      // 3.7% + $0.30 - Stripe fee (2.9% base + 0.8% international)
      // Formula: total = (bounty + 0.30) / 0.963
      // For $2000: total = 2000.30 / 0.963 = $2077.26, fee = $77.26
      const total = Math.round(((watchedBountyAmount + 0.30) / 0.963) * 100) / 100;
      const fee = Math.round((total - watchedBountyAmount) * 100) / 100;
      
      console.log('[FEE v2] bounty:', watchedBountyAmount, '-> total:', total, 'fee:', fee);
      
      setPlatformFee(fee);
      setTotalCharge(total);
    } else {
      setPlatformFee(0);
      setTotalCharge(0);
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
    if (currentRequirement.trim() && !verificationRequirements.includes(currentRequirement.trim()) && verificationRequirements.length < 10) {
      const newRequirements = [...verificationRequirements, currentRequirement.trim()];
      setVerificationRequirements(newRequirements);
      setValue('verificationRequirements', newRequirements);
      setCurrentRequirement('');
    }
  };

  const removeVerificationRequirement = (reqToRemove: string) => {
    const newRequirements = verificationRequirements.filter(req => req !== reqToRemove);
    setVerificationRequirements(newRequirements);
    setValue('verificationRequirements', newRequirements);
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

      // Validate adult confirmation for reconnections category
      if (data.category === 'reconnections' && !adultConfirmed) {
        toast({
          title: "Confirmation required",
          description: "Please confirm that the person you're searching for is 18 years or older.",
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
      
      // If we already have a setup intent (user went back to edit), 
      // just go back to payment without creating a new one
      if (clientSecret && setupIntentId) {
        setCurrentStep('payment');
        setIsSubmitting(false);
        return;
      }
      
      
      // Proceed to save card (SetupIntent)
      const { data: paymentData, error } = await supabase.functions.invoke('create-escrow-payment', {
        body: {
          amount: data.bountyAmount,
          currency: 'usd'
        }
      });

      if (error) throw error;

      setSetupIntentId(paymentData.setup_intent_id);
      setClientSecret(paymentData.client_secret);
      setEscrowId(paymentData.escrow_id);
      setPlatformFee(paymentData.stripe_fee); // Stripe processing fee (what poster pays)
      setTotalCharge(paymentData.total_charge); // Bounty + Stripe fee
      setCurrentStep('payment');
      
      toast({
        title: "Save your card",
        description: `Enter your card details to post a $${data.bountyAmount} bounty. You'll only be charged if you accept a submission.`,
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


  const handlePaymentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      return;
    }

    // Get CardNumberElement reference BEFORE any state changes
    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      toast({
        title: "Card Error",
        description: "Card form not ready. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    // Disable form inputs but don't unmount anything
    setIsPaymentProcessing(true);

    try {
      // SAVE CARD MODEL: Use confirmCardSetup instead of confirmCardPayment
      const { error: setupError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardNumberElement,
        }
      });

      if (setupError) {
        throw new Error(setupError.message);
      }

      // Only change to processing step after card is saved
      setCurrentStep('processing');

      if (setupIntent.status === 'succeeded') {
        // Card saved successfully, create bounty
        const formData = getValues();
        const { data: bountyData, error: bountyError } = await supabase.functions.invoke('confirm-escrow-and-create-bounty', {
          body: {
            setup_intent_id: setupIntent.id,
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
              hunter_purchases_item: hunterPurchasesItem
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
          description: "Your bounty is now live. Your card will be charged when you accept a submission.",
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
              Bounty: ${watchedBountyAmount?.toFixed(2) || '0.00'} USD
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
                  <span className="text-muted-foreground">Stripe processing fee (~3.7% + $0.30):</span>
                  <span>${platformFee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total you pay:</span>
                  <span>${totalCharge.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                You pay bounty + processing fee. No platform fees for posters.
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
                  <span>Only then: ${totalCharge.toFixed(2)} charged to you</span>
                </li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                💡 If your bounty expires or you cancel, you pay nothing.
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
          <h2 className="text-2xl font-bold mb-2">Creating Your Bounty</h2>
          <p className="text-muted-foreground">Please wait while we save your payment method and post your bounty...</p>
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

            {/* Adult Confirmation for Reconnections */}
            {selectedCategory === 'reconnections' && (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="ml-2">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="adultConfirmation"
                      checked={adultConfirmed}
                      onCheckedChange={(checked) => setAdultConfirmed(checked === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="adultConfirmation" className="text-sm cursor-pointer">
                      <span className="font-medium">I confirm that the person I am searching for is 18 years of age or older.</span>
                      <span className="block text-muted-foreground text-xs mt-1">
                        BountyBay does not allow bounties for locating minors. For missing children, please contact local authorities or the National Center for Missing & Exploited Children.
                      </span>
                    </label>
                  </div>
                </AlertDescription>
              </Alert>
            )}

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
                  className="placeholder:text-foreground/70 border-foreground/30"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  disabled={!currentTag.trim() || tags.length >= 10 || tags.includes(currentTag.trim())}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6"
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
                    <MapPin className="h-4 w-4" />
                    <span>Lead Only</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hunter locates the item for you. You'll arrange how to acquire it — whether that's picking it up, contacting the seller, or working out a deal.
                  </p>
                </div>
              </div>

              {/* Option 2: Find & Ship */}
              <div 
                className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  bountyType === 'find-and-ship' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-muted/30 hover:border-muted-foreground/50'
                }`}
                onClick={() => setBountyType('find-and-ship')}
              >
                <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  bountyType === 'find-and-ship' ? 'border-primary' : 'border-muted-foreground'
                }`}>
                  {bountyType === 'find-and-ship' && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 font-medium">
                    <Package className="h-4 w-4" />
                    <span>Find & Ship</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hunter finds the item, buys it if needed, and ships it to you. You'll reimburse their purchase cost + pay the bounty reward.
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
                <strong>How pricing works:</strong> The bounty reward is what you pay the hunter for finding your item. For "Find & Ship" bounties, you'll also reimburse the hunter for any purchase costs via "Send Additional Funds" after they ship.
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
                  min="10"
                  max="10000"
                  step="1"
                  placeholder="500"
                  className={`pl-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.bountyAmount || (watchedBountyAmount && watchedBountyAmount < 5) ? 'border-destructive' : ''}`}
                  {...register('bountyAmount', { 
                    valueAsNumber: true
                  })}
                />
              </div>
              {errors.bountyAmount && (
                <p className="text-sm text-destructive">{errors.bountyAmount.message}</p>
              )}
              {!errors.bountyAmount && typeof watchedBountyAmount === 'number' && !isNaN(watchedBountyAmount) && watchedBountyAmount < 10 && (
                <p className="text-sm text-destructive">Minimum bounty must be $10 USD</p>
              )}
              <p className="text-xs text-muted-foreground">
                💰 All amounts in USD. This is your reward to the hunter for <strong>finding</strong> the item - not the item's purchase price ($10 - $10,000 USD)
              </p>
            </div>

            {/* Fee Breakdown */}
            {watchedBountyAmount > 0 && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium">Payment Breakdown <span className="text-xs font-normal text-muted-foreground">(all amounts in USD)</span></h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Bounty Reward (Finder's Fee):</span>
                    <span className="font-medium">${watchedBountyAmount.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Payment Processing (3.7% + $0.30):</span>
                    <span>${platformFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold text-base">
                    <span>Total Charge:</span>
                    <span>${totalCharge.toFixed(2)} USD</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  💰 No platform fees for posters. Hunters pay $2 + 5% when paid out.
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
                      className={`pl-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.targetPriceMin ? 'border-destructive' : ''}`}
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
                      className={`pl-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.targetPriceMax ? 'border-destructive' : ''}`}
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
              
              {/* Show added requirements as badges */}
              {verificationRequirements.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {verificationRequirements.map((req) => (
                    <Badge key={req} variant="secondary" className="text-sm py-1 px-3">
                      {req}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-2 hover:bg-transparent"
                        onClick={() => removeVerificationRequirement(req)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Input with Add button inline */}
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., High-quality photos from multiple angles"
                  value={currentRequirement}
                  onChange={(e) => setCurrentRequirement(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addVerificationRequirement();
                    }
                  }}
                  disabled={verificationRequirements.length >= 10}
                />
                <Button
                  type="button"
                  onClick={addVerificationRequirement}
                  disabled={!currentRequirement.trim() || verificationRequirements.length >= 10 || verificationRequirements.includes(currentRequirement.trim())}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6"
                >
                  Add
                </Button>
              </div>

              {errors.verificationRequirements && (
                <p className="text-sm text-destructive">{errors.verificationRequirements.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Add up to 10 verification requirements
              </p>
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
              maxSize={20 * 1024 * 1024} // 20MB
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
          else if (watchedBountyAmount < 10) missingFields.push('Bounty amount (min $10)');
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
            {isSubmitting ? 'Creating Payment...' : `Continue to Payment ${totalCharge > 0 ? `($${totalCharge} total)` : watchedBountyAmount ? `($${watchedBountyAmount})` : ''}`}
          </Button>
        </div>
      </form>
    </div>
  );
}