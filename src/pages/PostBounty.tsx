import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, DollarSign, Upload, X, AlertCircle, CreditCard, Shield, Package, Link2, Lock, Gift, Check } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
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
import { CATEGORY_STRUCTURE } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile, deleteFile } from '@/lib/storage';
import { ImageUpload } from '@/components/ui/image-upload';
import { LocationPicker } from '@/components/ui/location-picker';
import { useAuth } from '@/contexts/AuthContext';
import { MANDATORY_VERIFICATION_REQUIREMENT } from '@/lib/constants';


const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

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
  const [isCheckingModeration, setIsCheckingModeration] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'details' | 'payment' | 'processing'>('details');
  const [intentId, setIntentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [escrowId, setEscrowId] = useState<string | null>(null);
  const [platformFee, setPlatformFee] = useState(0);
  const [totalCharge, setTotalCharge] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'immediate' | 'deferred'>('deferred');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [verificationRequirements, setVerificationRequirements] = useState<string[]>([MANDATORY_VERIFICATION_REQUIREMENT]);
  const [currentRequirement, setCurrentRequirement] = useState('');
  
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [hasDeadline, setHasDeadline] = useState(false);
  const [bountyType, setBountyType] = useState<'lead-only' | 'find-and-ship'>('lead-only');
  
  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoApplied, setPromoApplied] = useState<{ maxAmount: number; remainingUses: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [showPromoInput, setShowPromoInput] = useState(false);
  

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
      verificationRequirements: [MANDATORY_VERIFICATION_REQUIREMENT],
      deadline: undefined,
      category: undefined // Explicitly set to undefined
    }
  });

  const watchedBountyAmount = watch('bountyAmount');
  const watchedTargetMin = watch('targetPriceMin');
  const watchedTargetMax = watch('targetPriceMax');
  const selectedCategory = watch('category');

  // Auto-manage mandatory "Verified link" requirement based on bounty type
  useEffect(() => {
    if (bountyType === 'lead-only') {
      // Add mandatory requirement if not present
      if (!verificationRequirements.includes(MANDATORY_VERIFICATION_REQUIREMENT)) {
        const updated = [MANDATORY_VERIFICATION_REQUIREMENT, ...verificationRequirements];
        setVerificationRequirements(updated);
        setValue('verificationRequirements', updated);
      }
    } else {
      // Remove mandatory requirement for find-and-ship
      if (verificationRequirements.includes(MANDATORY_VERIFICATION_REQUIREMENT)) {
        const updated = verificationRequirements.filter(r => r !== MANDATORY_VERIFICATION_REQUIREMENT);
        setVerificationRequirements(updated);
        setValue('verificationRequirements', updated);
      }
    }
  }, [bountyType]);


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
        if (parsed.verificationRequirements) {
          const restored = parsed.verificationRequirements as string[];
          // Ensure mandatory requirement is always present
          if (!restored.includes(MANDATORY_VERIFICATION_REQUIREMENT)) {
            restored.unshift(MANDATORY_VERIFICATION_REQUIREMENT);
          }
          setVerificationRequirements(restored);
        }
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

  // Watch specific fields for auto-save (NOT using watch() as dependency - that causes infinite loops!)
  const watchedTitle = watch('title');
  const watchedDescription = watch('description');

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
  }, [watchedTitle, watchedDescription, tags, verificationRequirements, uploadedImages, hasDeadline, getValues]);

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
      setValue('verificationRequirements', newRequirements, { shouldValidate: true });
      setCurrentRequirement('');
      // Clear any verification-related validation errors
      setValidationErrors(prev => prev.filter(e => !e.toLowerCase().includes('verification')));
    }
  };

  const removeVerificationRequirement = (reqToRemove: string) => {
    // Prevent removing the mandatory requirement
    if (reqToRemove === MANDATORY_VERIFICATION_REQUIREMENT) return;
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

  const validatePromoCode = async (code: string) => {
    if (!code.trim()) return;
    setPromoValidating(true);
    setPromoError('');
    try {
      const { data, error } = await supabase.functions.invoke('validate-promo-code', {
        body: { code: code.trim() }
      });
      if (error) throw error;
      if (data.valid) {
        setPromoApplied({ maxAmount: data.max_amount, remainingUses: data.remaining_uses });
        setValue('bountyAmount', data.max_amount);
        setPlatformFee(0);
        setTotalCharge(0);
        toast({ title: "Promo code applied!", description: `Your $${data.max_amount} bounty is sponsored — no payment needed.` });
      } else {
        setPromoError(data.error || 'Invalid promo code');
        setPromoApplied(null);
      }
    } catch (err: any) {
      setPromoError('Failed to validate code');
      setPromoApplied(null);
    } finally {
      setPromoValidating(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode('');
    setPromoApplied(null);
    setPromoError('');
  };

  const onDetailsSubmit = async (data: PostBountyFormData) => {
    try {
      setIsSubmitting(true);
      setValidationErrors([]);
      
      const errors: string[] = [];
      
      // Validate required fields
      if (!data.category) {
        errors.push("Please select a category for your bounty.");
      }

      
      // CRITICAL: Validate verification requirements - filter empty strings and check count
      const validRequirements = verificationRequirements.filter(req => req.trim().length > 0);
      if (validRequirements.length === 0) {
        errors.push("Add at least one verification requirement to help hunters prove their find.");
      }
      
      // If there are validation errors, show them and stop
      if (errors.length > 0) {
        setValidationErrors(errors);
        toast({
          title: "Please fix the following",
          description: errors[0], // Show first error in toast
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
      setIsCheckingModeration(true);
      
      const { data: moderationData, error: moderationError } = await supabase.functions.invoke('moderate-content', {
        body: {
          title: data.title,
          description: data.description,
          tags: tags
        }
      });
      
      setIsCheckingModeration(false);
      
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
      
      // PROMO CODE FLOW: skip payment step entirely
      if (promoApplied) {
        setCurrentStep('processing');
        setTimeout(() => window.scrollTo(0, 0), 50);
        
        try {
          const { data: bountyData, error: bountyError } = await supabase.functions.invoke('confirm-escrow-and-create-bounty', {
            body: {
              promo_code: promoCode,
              bounty_data: {
                title: data.title,
                description: data.description,
                category: data.category,
                subcategory: data.subcategory,
                location: data.location,
                deadline: hasDeadline ? data.deadline : null,
                targetPriceMin: data.targetPriceMin,
                targetPriceMax: data.targetPriceMax,
                tags,
                verificationRequirements: verificationRequirements.filter(req => req.trim()),
                images: uploadedImages,
                requires_shipping: requiresShipping,
                hunter_purchases_item: hunterPurchasesItem
              }
            }
          });

          if (bountyError) {
            let errorMsg = 'Failed to create bounty.';
            try {
              const parsed = typeof bountyError === 'string' ? JSON.parse(bountyError) : bountyError;
              if (parsed?.error) errorMsg = parsed.error;
            } catch { if (typeof bountyError.message === 'string') errorMsg = bountyError.message; }
            throw new Error(errorMsg);
          }

          toast({
            title: "Bounty posted — sponsored!",
            description: "Your bounty is live. The sponsor covers the cost when you accept a submission.",
          });

          sessionStorage.removeItem('bounty_post_in_progress');
          sessionStorage.removeItem('bounty_draft');
          navigate(`/b/${bountyData.bounty_id}`);
          return;
        } catch (error: any) {
          toast({ title: "Error", description: error.message || "Please try again.", variant: "destructive" });
          setCurrentStep('details');
          setIsSubmitting(false);
          return;
        }
      }
      
      // If we already have a client secret (user went back to edit), 
      // just go back to payment without creating a new one
      if (clientSecret && intentId) {
        setCurrentStep('payment');
        setTimeout(() => window.scrollTo(0, 0), 50);
        setIsSubmitting(false);
        return;
      }
      
      
      // Proceed to create payment/setup intent based on amount
      const { data: paymentData, error } = await supabase.functions.invoke('create-escrow-payment', {
        body: {
          amount: data.bountyAmount,
          currency: 'usd'
        }
      });

      if (error) throw error;

      // All bounties now use SetupIntent (card-save only, no auth holds)
      setIntentId(paymentData.setup_intent_id);
      setClientSecret(paymentData.client_secret);
      setEscrowId(paymentData.escrow_id);
      setPlatformFee(paymentData.stripe_fee); // Stripe processing fee (what poster pays)
      setTotalCharge(paymentData.total_charge); // Bounty + Stripe fee
      setPaymentMode('deferred'); // Always deferred now - no auth holds
      setCurrentStep('payment');
      setTimeout(() => window.scrollTo(0, 0), 50);
      
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
      // All bounties use SetupIntent (card-save only, no auth holds)
      const { error: setupError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardNumberElement,
        }
      });

      if (setupError) {
        // Parse Stripe error for specific, user-friendly messages
        let userMessage = setupError.message || 'Card verification failed.';
        const code = setupError.code;
        const declineCode = (setupError as any).decline_code;
        
        if (code === 'incorrect_cvc' || declineCode === 'incorrect_cvc') {
          userMessage = 'Incorrect CVC/security code. Please check the 3-digit code on the back of your card.';
        } else if (code === 'invalid_expiry_month' || code === 'invalid_expiry_year' || code === 'card_declined' && declineCode === 'expired_card') {
          userMessage = 'Invalid expiry date. Please check your card\'s expiration date.';
        } else if (code === 'incorrect_number' || code === 'invalid_number') {
          userMessage = 'Invalid card number. Please double-check your card number.';
        } else if (code === 'card_declined') {
          userMessage = `Card declined${declineCode ? ` (${declineCode})` : ''}. Please try a different card.`;
        } else if (code === 'processing_error') {
          userMessage = 'Processing error. Please try again in a moment.';
        }
        
        console.error('[Payment] Stripe error:', { code, declineCode, message: setupError.message });
        throw new Error(userMessage);
      }

      if (!setupIntent || setupIntent.status !== 'succeeded') {
        throw new Error('Card setup failed. Please try again.');
      }

      const confirmResult = { intentId: setupIntent.id, status: setupIntent.status };

      // Only change to processing step after card is confirmed
      setCurrentStep('processing');

      // Card confirmed, create bounty
      const formData = getValues();
      const { data: bountyData, error: bountyError } = await supabase.functions.invoke('confirm-escrow-and-create-bounty', {
        body: {
          setup_intent_id: confirmResult.intentId,
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

      if (bountyError) {
        // Parse edge function errors for specific messages
        let errorMsg = 'Failed to create bounty. Please try again.';
        try {
          const parsed = typeof bountyError === 'string' ? JSON.parse(bountyError) : bountyError;
          if (parsed?.error) errorMsg = parsed.error;
          if (parsed?.code === 'CVC_ERROR') {
            errorMsg = 'Card security code (CVC) verification failed. Please go back and re-enter your card details.';
            // Reset to payment step so user can re-enter card
            setClientSecret(null);
            setIntentId(null);
            setCurrentStep('details');
          }
        } catch { 
          if (typeof bountyError.message === 'string') errorMsg = bountyError.message;
        }
        throw new Error(errorMsg);
      }

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
      }

      toast({
        title: "Bounty posted successfully!",
        description: "Your bounty is now live. Your card will be charged when you accept a submission.",
      });

      sessionStorage.removeItem('bounty_post_in_progress');
      sessionStorage.removeItem('bounty_draft');

      navigate(`/b/${bountyData.bounty_id}`);
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
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Verify Your Payment Method
          </h1>
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
                <strong>No charge today:</strong> We verify and securely save your card. 
                You're only charged when you approve a hunter's submission. If no one claims your bounty, you pay nothing.
              </AlertDescription>
            </Alert>

            {/* Payment Breakdown */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">
                When You Approve a Submission
              </h4>
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

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCurrentStep('details');
                    setTimeout(() => window.scrollTo(0, 0), 50);
                  }}
                  disabled={isPaymentProcessing}
                  className="w-full sm:w-auto"
                >
                  Back to Details
                </Button>
                <Button 
                  type="submit" 
                  disabled={!stripe || !elements || isPaymentProcessing}
                  className="w-full sm:flex-1 bg-primary hover:bg-primary-hover"
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
    <>
      {/* Moderation Check Overlay */}
      {isCheckingModeration && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg p-6 shadow-lg max-w-sm mx-4 text-center animate-scale-in">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="font-semibold text-foreground mb-2">Checking Community Guidelines</h3>
            <p className="text-sm text-muted-foreground">Verifying your bounty content...</p>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Post a Bounty</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Tell our community what you're looking for and set a reward.
        </p>
      </div>

      <form onSubmit={handleSubmit(onDetailsSubmit)} className="space-y-5 sm:space-y-8">
        {/* Basic Information */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="What are you looking for? Be specific..."
                spellCheck={true}
                {...register('title')}
                className={`${errors.title ? 'border-destructive' : ''} overflow-x-auto`}
                style={{ textOverflow: 'clip' }}
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
                  spellCheck={true}
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
                    <Link2 className="h-4 w-4" />
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
        <Card className="bg-card border-border">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 sm:space-y-6">
            <Alert className="bg-background border-border">
              <Shield className="h-4 w-4 shrink-0" />
              <AlertDescription className="text-xs sm:text-sm">
                <strong>How it works:</strong> The bounty is your reward to the hunter. For "Find & Ship" bounties, you reimburse item costs separately.
              </AlertDescription>
            </Alert>

            {/* Promo Code Section */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowPromoInput(!showPromoInput)}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Gift className="h-3.5 w-3.5" />
                {showPromoInput ? 'Hide promo code' : 'Have a promo code?'}
              </button>
              
              {showPromoInput && (
                <div className="space-y-2">
                  {promoApplied ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Sponsored — your ${promoApplied.maxAmount} bounty is covered!
                      </span>
                      <button
                        type="button"
                        onClick={removePromoCode}
                        className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        className="uppercase tracking-wider font-mono"
                        maxLength={30}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            validatePromoCode(promoCode);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => validatePromoCode(promoCode)}
                        disabled={!promoCode.trim() || promoValidating}
                        variant="outline"
                        className="shrink-0"
                      >
                        {promoValidating ? 'Checking...' : 'Apply'}
                      </Button>
                    </div>
                  )}
                  {promoError && (
                    <p className="text-sm text-destructive">{promoError}</p>
                  )}
                </div>
              )}
            </div>

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
                  disabled={!!promoApplied}
                  className={`pl-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.bountyAmount || (watchedBountyAmount && watchedBountyAmount < 10) ? 'border-destructive' : ''} ${promoApplied ? 'opacity-60' : ''}`}
                  {...register('bountyAmount', { 
                    valueAsNumber: true
                  })}
                />
              </div>
              {errors.bountyAmount && (
                <p className="text-sm text-destructive">{errors.bountyAmount.message}</p>
              )}
              {!errors.bountyAmount && typeof watchedBountyAmount === 'number' && !isNaN(watchedBountyAmount) && watchedBountyAmount > 0 && watchedBountyAmount < 10 && (
                <p className="text-sm text-destructive">Minimum bounty must be $10 USD</p>
              )}
              {promoApplied ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                  🎁 This bounty is sponsored — amount locked at ${promoApplied.maxAmount}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  💰 This is your reward to the hunter for <strong>finding</strong> the item ($10 - $10,000 USD)
                </p>
              )}
            </div>

            {/* Fee Breakdown - only show when bounty amount is valid and no promo applied */}
            {!promoApplied && typeof watchedBountyAmount === 'number' && !isNaN(watchedBountyAmount) && watchedBountyAmount > 0 && (
              <div className="bg-background border border-border p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-sm sm:text-base">Payment Breakdown <span className="text-xs font-normal text-muted-foreground">(all amounts in USD)</span></h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Bounty Reward:</span>
                    <span className="font-medium">${watchedBountyAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between gap-2 text-muted-foreground text-xs sm:text-sm">
                    <span>Processing (3.7% + $0.30):</span>
                    <span>${(platformFee || 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between gap-2 font-semibold text-sm sm:text-base">
                    <span>Total:</span>
                    <span>${(totalCharge || 0).toFixed(2)} USD</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  💰 No platform fees for posters. Hunters pay $2 + 5% when paid out.
                </p>
                
                {/* Card-save-only model - always show this message */}
                <Alert className="mt-3 border-emerald-500/50 bg-emerald-500/10">
                  <CreditCard className="h-4 w-4 text-emerald-500 shrink-0" />
                  <AlertDescription className="text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm">
                    <strong>Card saved only:</strong> Not charged until you accept a claim.
                  </AlertDescription>
                </Alert>
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
                      step="1"
                      placeholder="Min price"
                      className={`pl-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.targetPriceMin ? 'border-destructive' : ''}`}
                      {...register('targetPriceMin', { 
                        valueAsNumber: true
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
                      step="1"
                      placeholder="Max price"
                      className={`pl-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.targetPriceMax ? 'border-destructive' : ''}`}
                      {...register('targetPriceMax', { 
                        valueAsNumber: true
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

            {typeof watchedTargetMin === 'number' && !isNaN(watchedTargetMin) && 
             typeof watchedTargetMax === 'number' && !isNaN(watchedTargetMax) && 
             watchedTargetMin > watchedTargetMax && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <AlertDescription className="text-xs sm:text-sm">
                  Minimum price cannot be greater than maximum price
                </AlertDescription>
              </Alert>
            )}

          </CardContent>
        </Card>

        {/* Timeline & Verification */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              Timeline & Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 sm:space-y-6">
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

              {/* Mandatory checkbox for lead-only bounties */}
              {bountyType === 'lead-only' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-3">
                  <div className="h-4 w-4 rounded border border-primary bg-primary flex items-center justify-center">
                    <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">{MANDATORY_VERIFICATION_REQUIREMENT}</span>
                  <Lock className="h-3 w-3 text-muted-foreground ml-auto" />
                </div>
              )}
              
              {/* Show added requirements as badges (excluding mandatory) */}
              {verificationRequirements.filter(r => r !== MANDATORY_VERIFICATION_REQUIREMENT).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {verificationRequirements.filter(r => r !== MANDATORY_VERIFICATION_REQUIREMENT).map((req) => (
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
                {bountyType === 'lead-only' 
                  ? 'A verified link is always required for Lead Only bounties. Add up to 9 more requirements.'
                  : 'Add up to 10 verification requirements.'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Image Upload */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
              Images (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              onReorder={(reordered) => setUploadedImages(reordered)}
              uploadedImages={uploadedImages}
              maxFiles={5}
              maxSize={20 * 1024 * 1024} // 20MB
            />
            <p className="text-xs text-muted-foreground mt-2">
              Upload up to 5 reference images. <span className="text-foreground font-medium">No photo? No problem</span> — hunters can still find your item without one.
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
              <Alert variant="destructive" className="mb-4 bg-destructive/10">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <AlertDescription className="text-xs sm:text-sm">
                  <strong>Please complete:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
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
              watchedBountyAmount < 10 || 
              watchedBountyAmount > 10000 ||
              !watch('location')?.trim() ||
              (watch('tags') || []).length === 0 ||
              verificationRequirements.filter(r => r.trim()).length === 0
            }
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            {isSubmitting ? 'Creating Payment...' : `Continue to Payment${typeof totalCharge === 'number' && !isNaN(totalCharge) && totalCharge > 0 ? ` ($${totalCharge.toFixed(2)})` : typeof watchedBountyAmount === 'number' && !isNaN(watchedBountyAmount) && watchedBountyAmount > 0 ? ` ($${watchedBountyAmount})` : ''}`}
          </Button>
        </div>
      </form>
    </div>
    </>
  );
}