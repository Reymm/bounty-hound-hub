import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, DollarSign, MapPin, Upload, X, Plus, AlertCircle } from 'lucide-react';
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

export default function PostBounty() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [verificationRequirements, setVerificationRequirements] = useState<string[]>(['']);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
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

  const onSubmit = async (data: PostBountyFormData) => {
    try {
      setIsSubmitting(true);

      // TODO: Replace with actual Supabase call
      const bounty = await mockApi.createBounty({
        title: data.title,
        description: data.description,
              category: data.category,
              subcategory: data.subcategory,
        location: data.location,
        deadline: data.deadline,
        bountyAmount: data.bountyAmount,
        targetPriceMin: data.targetPriceMin,
        targetPriceMax: data.targetPriceMax,
        tags,
        verificationRequirements: verificationRequirements.filter(req => req.trim()),
        images: [] // TODO: Handle image uploads
      });

      toast({
        title: "Bounty posted successfully!",
        description: "Your bounty is now live and hunters can start claiming it.",
      });

      navigate(`/b/${bounty.id}`);
    } catch (error) {
      console.error('Error posting bounty:', error);
      toast({
        title: "Error posting bounty",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Post a Bounty</h1>
        <p className="text-muted-foreground">
          Tell our community what you're looking for and set a bounty for successful finds.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The bounty amount will be held in escrow and released to the successful hunter upon your approval.
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
                  min="10"
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
                Amount to reward the successful hunter ($10 - $10,000)
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
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            {isSubmitting ? 'Posting Bounty...' : `Post Bounty ${watchedBountyAmount ? `($${watchedBountyAmount})` : ''}`}
          </Button>
        </div>
      </form>
    </div>
  );
}