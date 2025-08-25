import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, User, MapPin, CheckCircle, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const profileSetupSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email address is required'),
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters'),
  region: z.string()
    .max(100, 'Region must be less than 100 characters')
    .optional(),
  accountType: z.enum(['poster', 'hunter', 'both'], {
    required_error: 'Please select an account type',
  }),
  emailNotifications: z.boolean().optional(),
});

type ProfileSetupFormData = z.infer<typeof profileSetupSchema>;

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showChooserModal, setShowChooserModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<ProfileSetupFormData>({
    resolver: zodResolver(profileSetupSchema),
    mode: 'onChange',
    defaultValues: {
      accountType: 'both',
      emailNotifications: false,
    },
  });

  const onSubmit = async (data: ProfileSetupFormData) => {
    try {
      setIsSubmitting(true);
      
      // TODO: Save profile data to Supabase
      console.log('Profile setup data:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Profile setup complete!",
        description: "Welcome to BountyBay. You can now post your first bounty or start hunting.",
      });
      
      // Route based on account type
      if (data.accountType === 'poster') {
        navigate('/post');
      } else if (data.accountType === 'hunter') {
        navigate('/bounties');
      } else {
        // Both - show chooser modal
        setShowChooserModal(true);
      }
      
    } catch (error) {
      console.error('Error setting up profile:', error);
      toast({
        title: "Error setting up profile",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChoice = (choice: 'post' | 'browse') => {
    setShowChooserModal(false);
    if (choice === 'post') {
      navigate('/post');
    } else {
      navigate('/bounties');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-4">
            <User className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to BountyBay!
          </h1>
          <p className="text-muted-foreground">
            Set up your profile so you can start posting or hunting bounties
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-primary" />
              Complete Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...register('email')}
                  className={errors.email ? 'border-destructive' : ''}
                />
                <p className="text-sm text-muted-foreground">
                  We'll send confirmations and important updates here.
                </p>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  placeholder="How should others see you?"
                  {...register('displayName')}
                  className={errors.displayName ? 'border-destructive' : ''}
                />
                {errors.displayName && (
                  <p className="text-sm text-destructive">{errors.displayName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Your Region</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="region"
                    placeholder="e.g., New York, London, Tokyo (optional)"
                    className={`pl-10 ${errors.region ? 'border-destructive' : ''}`}
                    {...register('region')}
                  />
                </div>
                {errors.region && (
                  <p className="text-sm text-destructive">{errors.region.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label>Account Type *</Label>
                <RadioGroup
                  value={watch('accountType')}
                  onValueChange={(value) => setValue('accountType', value as 'poster' | 'hunter' | 'both')}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="poster" id="poster" />
                    <Label htmlFor="poster" className="font-normal cursor-pointer">
                      Poster - I want to post bounties for items I need
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hunter" id="hunter" />
                    <Label htmlFor="hunter" className="font-normal cursor-pointer">
                      Hunter - I want to find items for others
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both" className="font-normal cursor-pointer">
                      Both - I want to post bounties and hunt for others
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-sm text-muted-foreground">
                  You can change this later in Settings.
                </p>
                {errors.accountType && (
                  <p className="text-sm text-destructive">{errors.accountType.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emailNotifications"
                  checked={watch('emailNotifications')}
                  onCheckedChange={(checked) => setValue('emailNotifications', !!checked)}
                />
                <Label htmlFor="emailNotifications" className="text-sm font-normal cursor-pointer">
                  Email me when someone finds a match or messages me
                </Label>
              </div>

              <div className="bg-primary/5 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">What's next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Post your first bounty or start hunting</li>
                  <li>• Connect with hunters worldwide</li>
                  <li>• Find exactly what you're looking for</li>
                </ul>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-hover text-primary-foreground"
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? (
                  'Setting up your profile...'
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <button 
              onClick={() => navigate('/me/profile')}
              className="text-primary hover:underline"
            >
              Go to your profile
            </button>
          </p>
        </div>
      </div>

      {/* Chooser Modal for "Both" account type */}
      <Dialog open={showChooserModal} onOpenChange={setShowChooserModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">What do you want to do first?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Button
              onClick={() => handleChoice('post')}
              className="h-12 bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              <Plus className="h-5 w-5 mr-2" />
              Post a Bounty
            </Button>
            <Button
              onClick={() => handleChoice('browse')}
              variant="outline"
              className="h-12"
            >
              <Search className="h-5 w-5 mr-2" />
              Browse Bounties
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileSetup;