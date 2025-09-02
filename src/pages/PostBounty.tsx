import { useState } from 'react';
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
  const [currentStep, setCurrentStep] = useState<'details' | 'payment' | 'processing'>('details');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [escrowId, setEscrowId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [verificationRequirements, setVerificationRequirements] = useState<string[]>(['']);

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

  const onDetailsSubmit = async (data: PostBountyFormData) => {
    try {
      setIsSubmitting(true);
      
      // Create payment intent for escrow
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
      setCurrentStep('payment');
      
      toast({
        title: "Payment created",
        description: "Please complete your escrow payment to secure the bounty funds.",
      });

    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error creating payment",
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
              verificationRequirements: verificationRequirements.filter(req => req.trim())
            }
          }
        });

        if (bountyError) throw bountyError;

        toast({
          title: "Bounty posted successfully!",
          description: "Your bounty is now live with funds secured in escrow.",
        });

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
              Escrow Payment - ${watchedBountyAmount}
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
                      Secure ${watchedBountyAmount} in Escrow
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
              <Label htmlFor="location">
                Location <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="location"
                  placeholder="City, State or Region"
                  className={`pl-10 ${errors.location ? 'border-destructive' : ''}`}
                  {...register('location')}
                />
              </div>
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location.message}</p>
              )}
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
                    {...register('targetPriceMin', { valueAsNumber: true })}
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
                    {...register('targetPriceMax', { valueAsNumber: true })}
                  />
                </div>
                {errors.targetPriceMax && (
                  <p className="text-sm text-destructive">{errors.targetPriceMax.message}</p>
                )}
              </div>
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

        {/* Image Upload (TODO) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Images (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                Upload reference images to help hunters understand what you're looking for
              </p>
              <p className="text-xs text-muted-foreground">
                TODO: Image upload will be implemented with Supabase Storage
              </p>
              <Button type="button" variant="outline" disabled className="mt-4">
                Choose Images
              </Button>
            </div>
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
            {isSubmitting ? 'Creating Payment...' : `Continue to Payment ${watchedBountyAmount ? `($${watchedBountyAmount})` : ''}`}
          </Button>
        </div>
      </form>
    </div>
  );
}