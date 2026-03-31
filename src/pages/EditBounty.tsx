import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft, Loader2, X, Plus, Lock } from 'lucide-react';
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
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { ImageUpload } from '@/components/ui/image-upload';
import { LocationPicker } from '@/components/ui/location-picker';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile, deleteFile } from '@/lib/storage';
import { BountyCategory, CATEGORY_STRUCTURE } from '@/lib/types';
import { MANDATORY_VERIFICATION_REQUIREMENT } from '@/lib/constants';

interface EditBountyFormData {
  title: string;
  description: string;
  location: string;
  category: BountyCategory;
  subcategory?: string;
}

export default function EditBounty() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bounty, setBounty] = useState<any>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [verificationRequirements, setVerificationRequirements] = useState<string[]>(['']);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<EditBountyFormData>();

  const selectedCategory = watch('category');

  useEffect(() => {
    loadBounty();
  }, [id]);

  const loadBounty = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Bounties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Check if user owns this bounty
      if (data.poster_id !== user?.id) {
        toast({
          title: "Access denied",
          description: "You can only edit your own bounties.",
          variant: "destructive",
        });
        navigate(`/b/${id}`);
        return;
      }

      // Check if bounty can be edited (only open/draft)
      if (!['open', 'draft'].includes(data.status)) {
        toast({
          title: "Cannot edit",
          description: "This bounty cannot be edited because it's no longer open.",
          variant: "destructive",
        });
        navigate(`/b/${id}`);
        return;
      }

      setBounty(data);
      setUploadedImages(data.images || []);
      setTags(data.tags || []);
      const existingReqs = data.verification_requirements || [''];
      // Ensure mandatory requirement is always present
      if (!existingReqs.includes(MANDATORY_VERIFICATION_REQUIREMENT)) {
        existingReqs.unshift(MANDATORY_VERIFICATION_REQUIREMENT);
      }
      setVerificationRequirements(existingReqs);

      // Set form values
      reset({
        title: data.title,
        description: data.description || '',
        location: data.location || '',
        category: data.category as BountyCategory,
        subcategory: data.subcategory || '',
      });
    } catch (error) {
      console.error('Error loading bounty:', error);
      toast({
        title: "Error",
        description: "Failed to load bounty details.",
        variant: "destructive",
      });
      navigate('/me/bounties');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 5) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleImageUpload = async (files: File[], onProgress?: (fileName: string, progress: number) => void) => {
    if (!user?.id) return;
    
    for (const file of files) {
      try {
        const result = await uploadFile(file, 'bounty-images', user.id, undefined, (progress) => {
          onProgress?.(file.name, progress);
        });
        
        if (result.url) {
          setUploadedImages(prev => [...prev, result.url!]);
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  };

  const handleImageRemove = async (imageUrl: string) => {
    // Remove from UI state immediately - don't delete from storage
    // The image will be orphaned but that's safer than deleting before save
    setUploadedImages(prev => prev.filter(img => img !== imageUrl));
  };

  const addVerificationRequirement = () => {
    if (verificationRequirements.length < 5) {
      setVerificationRequirements([...verificationRequirements, '']);
    }
  };

  const removeVerificationRequirement = (index: number) => {
    // Prevent removing the mandatory requirement
    if (verificationRequirements[index] === MANDATORY_VERIFICATION_REQUIREMENT) return;
    setVerificationRequirements(verificationRequirements.filter((_, i) => i !== index));
  };

  const updateVerificationRequirement = (index: number, value: string) => {
    const updated = [...verificationRequirements];
    updated[index] = value;
    setVerificationRequirements(updated);
  };

  const onSubmit = async (data: EditBountyFormData) => {
    if (!id) return;
    
    try {
      setSaving(true);

      // Run content moderation before saving
      try {
        const { data: moderationResult, error: moderationError } = await supabase.functions.invoke('moderate-content', {
          body: {
            title: data.title,
            description: data.description,
            tags: tags,
          },
        });

        if (moderationError) {
          console.error('Moderation error:', moderationError);
          toast({
            title: "Content check failed",
            description: "Unable to verify content. Please try again.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }

        if (!moderationResult.allowed) {
          toast({
            title: "Content not allowed",
            description: moderationResult.message || "Your content violates our community guidelines.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
      } catch (modError) {
        console.error('Moderation request failed:', modError);
        toast({
          title: "Content check failed",
          description: "Unable to verify content. Please try again.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const filteredRequirements = verificationRequirements.filter(req => req.trim() !== '');

      const { error } = await supabase
        .from('Bounties')
        .update({
          title: data.title,
          description: data.description,
          location: data.location,
          category: data.category,
          subcategory: data.subcategory || null,
          images: uploadedImages,
          tags: tags,
          verification_requirements: filteredRequirements.length > 0 ? filteredRequirements : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('poster_id', user?.id);

      if (error) throw error;

      toast({
        title: "Bounty updated",
        description: "Your bounty has been successfully updated.",
      });

      // Reset viewport zoom and scroll before navigating (fixes Safari mobile zoom issues)
      window.scrollTo(0, 0);
      
      // Small delay to ensure viewport resets before navigation
      setTimeout(() => {
        navigate(`/b/${id}`, { replace: true });
      }, 50);
    } catch (error) {
      console.error('Error updating bounty:', error);
      toast({
        title: "Error",
        description: "Failed to update bounty. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSkeleton className="h-12 w-48 mb-6" />
        <LoadingSkeleton className="h-96" />
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Bounty not found</h1>
        <Button asChild>
          <Link to="/me/bounties">Back to My Bounties</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link to={`/b/${id}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bounty
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Bounty</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register('title', { required: 'Title is required' })}
                placeholder="What are you looking for?"
                className="overflow-x-auto"
                style={{ textOverflow: 'clip' }}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register('description', { required: 'Description is required' })}
                placeholder="Describe the item in detail..."
                rows={5}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: 'Category is required' }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(CATEGORY_STRUCTURE).map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {selectedCategory && CATEGORY_STRUCTURE[selectedCategory as BountyCategory]?.subcategories && Object.keys(CATEGORY_STRUCTURE[selectedCategory as BountyCategory].subcategories).length > 0 && (
                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Controller
                    name="subcategory"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORY_STRUCTURE[selectedCategory as BountyCategory].subcategories).map(([key, label]) => (
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

            {/* Location */}
            <div className="space-y-2">
              <Label>Location *</Label>
              <Controller
                name="location"
                control={control}
                rules={{ required: 'Location is required' }}
                render={({ field }) => (
                  <LocationPicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter city or region"
                  />
                )}
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location.message}</p>
              )}
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Reference Images</Label>
              <ImageUpload
                uploadedImages={uploadedImages}
                onUpload={handleImageUpload}
                onRemove={handleImageRemove}
                onReorder={(reordered) => setUploadedImages(reordered)}
                maxFiles={5}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Verification Requirements */}
            <div className="space-y-2">
              <Label>Verification Requirements</Label>
              <p className="text-sm text-muted-foreground">
                What proof do you need from hunters?
              </p>
              {verificationRequirements.map((req, index) => {
                const isMandatory = req === MANDATORY_VERIFICATION_REQUIREMENT;
                return (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={req}
                      onChange={(e) => updateVerificationRequirement(index, e.target.value)}
                      placeholder="e.g., Photo of item with timestamp"
                      disabled={isMandatory}
                      className={isMandatory ? 'bg-primary/5 border-primary/30' : ''}
                    />
                    {isMandatory ? (
                      <div className="flex items-center justify-center w-10 h-10 text-primary">
                        <Lock className="h-4 w-4" />
                      </div>
                    ) : verificationRequirements.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVerificationRequirement(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
              {verificationRequirements.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVerificationRequirement}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              )}
            </div>

            {/* Note about non-editable fields */}
            <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Note:</p>
              <p>
                The reward amount, deadline, and bounty type cannot be changed after posting. 
                If you need to modify these, please cancel this bounty and create a new one.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
              <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
                <Link to={`/b/${id}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={saving} className="w-full sm:flex-1">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
