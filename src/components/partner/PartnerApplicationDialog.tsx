import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Handshake, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const applicationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email'),
  business_name: z.string().max(100).optional(),
  website_url: z.string().max(500).optional(),
  social_media_handles: z.string().max(500).optional(),
  audience_size: z.string().optional(),
  message: z.string().min(20, 'Please provide more detail (at least 20 characters)').max(2000),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface PartnerApplicationDialogProps {
  trigger?: React.ReactNode;
}

export function PartnerApplicationDialog({ trigger }: PartnerApplicationDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: '',
      email: '',
      business_name: '',
      website_url: '',
      social_media_handles: '',
      audience_size: '',
      message: '',
    },
  });

  const onSubmit = async (data: ApplicationFormData) => {
    setSubmitting(true);
    try {
      // Auto-prepend https:// if website has no protocol
      let websiteUrl = data.website_url?.trim() || null;
      if (websiteUrl && !websiteUrl.match(/^https?:\/\//i)) {
        websiteUrl = `https://${websiteUrl}`;
      }

      const { error } = await supabase
        .from('partner_applications')
        .insert({
          name: data.name,
          email: data.email,
          business_name: data.business_name || null,
          website_url: websiteUrl,
          social_media_handles: data.social_media_handles || null,
          audience_size: data.audience_size || null,
          message: data.message,
        });

      if (error) throw error;

      toast({
        title: 'Application submitted!',
        description: "Thank you for your interest! We'll review your application and get back to you soon.",
      });

      reset();
      setOpen(false);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1 py-1 flex items-center gap-1.5">
            <Handshake className="h-4 w-4" />
            Become a Partner
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" />
            Partner Application
          </DialogTitle>
          <DialogDescription>
            Interested in partnering with BountyBay? Tell us about yourself and your audience.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business/Brand Name</Label>
              <Input
                id="business_name"
                placeholder="Optional"
                {...register('business_name')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Website</Label>
              <Input
                id="website_url"
                type="url"
                placeholder="https://..."
                {...register('website_url')}
              />
              {errors.website_url && (
                <p className="text-xs text-destructive">{errors.website_url.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="social_media_handles">Social Media Handles</Label>
            <Input
              id="social_media_handles"
              placeholder="@instagram, @twitter, YouTube channel, etc."
              {...register('social_media_handles')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience_size">Audience Size</Label>
            <Select onValueChange={(value) => setValue('audience_size', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your audience size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under-1k">Under 1,000</SelectItem>
                <SelectItem value="1k-10k">1,000 - 10,000</SelectItem>
                <SelectItem value="10k-50k">10,000 - 50,000</SelectItem>
                <SelectItem value="50k-100k">50,000 - 100,000</SelectItem>
                <SelectItem value="100k-500k">100,000 - 500,000</SelectItem>
                <SelectItem value="500k+">500,000+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Tell us about your partnership idea *</Label>
            <Textarea
              id="message"
              placeholder="What makes you a great fit? How would you promote BountyBay? What's your niche?"
              rows={4}
              {...register('message')}
            />
            {errors.message && (
              <p className="text-xs text-destructive">{errors.message.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
