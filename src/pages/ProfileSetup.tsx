import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, User, CheckCircle, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LocationPicker } from '@/components/ui/location-picker';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const profileSetupSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters'),
  region: z.string()
    .max(100, 'Region must be less than 100 characters')
    .optional(),
  accountType: z.enum(['hunter', 'poster', 'both'], {
    required_error: 'Please select an account type',
  }),
});

type ProfileSetupFormData = z.infer<typeof profileSetupSchema>;

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showChooserModal, setShowChooserModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    control,
  } = useForm<ProfileSetupFormData>({
    resolver: zodResolver(profileSetupSchema),
    mode: 'onChange',
    defaultValues: {
      username: '',
      displayName: '',
      region: '',
      accountType: undefined,
    },
  });

  // Load existing profile data if any
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      const [profileResult, rolesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', user.id)
          .single(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
      ]);
      
      if (profileResult.data) {
        if (profileResult.data.username) setValue('username', profileResult.data.username);
        if (profileResult.data.full_name) setValue('displayName', profileResult.data.full_name);
      }
      
      if (rolesResult.data && rolesResult.data.length > 0) {
        const roles = rolesResult.data.map(r => r.role);
        if (roles.includes('hunter') && roles.includes('poster')) {
          setValue('accountType', 'both');
        } else if (roles.includes('hunter')) {
          setValue('accountType', 'hunter');
        } else if (roles.includes('poster')) {
          setValue('accountType', 'poster');
        }
      }
    };
    
    loadProfile();
  }, [user, setValue]);

  const onSubmit = async (data: ProfileSetupFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to complete profile setup.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Save profile data to Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          full_name: data.displayName,
        })
        .eq('id', user.id);

      if (profileError) {
        if (profileError.code === '23505') {
          // Unique constraint violation
          toast({
            title: "Username taken",
            description: "This username is already in use. Please choose another.",
            variant: "destructive",
          });
          return;
        }
        throw profileError;
      }

      // Delete existing roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);

      // Insert new roles based on account type
      const rolesToInsert = data.accountType === 'both' 
        ? [{ user_id: user.id, role: 'hunter' as const }, { user_id: user.id, role: 'poster' as const }]
        : [{ user_id: user.id, role: data.accountType as 'hunter' | 'poster' }];

      const { error: rolesError } = await supabase
        .from('user_roles')
        .insert(rolesToInsert);

      if (rolesError) {
        throw rolesError;
      }
      
      toast({
        title: "Profile setup complete!",
        description: "Welcome to BountyBay. You can now start posting or hunting bounties.",
      });
      
      // Show chooser modal only if account type is "both"
      if (data.accountType === 'both') {
        setShowChooserModal(true);
      } else if (data.accountType === 'poster') {
        navigate('/post');
      } else {
        navigate('/bounties');
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
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  placeholder="Choose a unique username"
                  {...register('username')}
                  className={errors.username ? 'border-destructive' : ''}
                />
                <p className="text-sm text-muted-foreground">
                  This will be your public display name on BountyBay.
                </p>
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Full Name *</Label>
                <Input
                  id="displayName"
                  placeholder="Your full name"
                  {...register('displayName')}
                  className={errors.displayName ? 'border-destructive' : ''}
                />
                {errors.displayName && (
                  <p className="text-sm text-destructive">{errors.displayName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Your Region (Optional)</Label>
                <Controller
                  name="region"
                  control={control}
                  render={({ field }) => (
                    <LocationPicker
                      value={field.value}
                      onChange={(location) => field.onChange(location)}
                      placeholder="Search for a city, state or region..."
                      className={errors.region ? 'border-destructive' : ''}
                    />
                  )}
                />
                {errors.region && (
                  <p className="text-sm text-destructive">{errors.region.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Account Type *</Label>
                <Controller
                  name="accountType"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="space-y-3"
                    >
                      <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value="hunter" id="hunter" className="mt-0.5" />
                        <div className="flex-1">
                          <Label htmlFor="hunter" className="text-base font-medium cursor-pointer">
                            Hunter
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            I want to find items for others
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value="poster" id="poster" className="mt-0.5" />
                        <div className="flex-1">
                          <Label htmlFor="poster" className="text-base font-medium cursor-pointer">
                            Poster
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            I want others to find items for me
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value="both" id="both" className="mt-0.5" />
                        <div className="flex-1">
                          <Label htmlFor="both" className="text-base font-medium cursor-pointer">
                            Both
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            I want to do both - find items and post bounties
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  )}
                />
                {errors.accountType && (
                  <p className="text-sm text-destructive">{errors.accountType.message}</p>
                )}
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
            <DialogTitle className="text-center">What would you like to do first?</DialogTitle>
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