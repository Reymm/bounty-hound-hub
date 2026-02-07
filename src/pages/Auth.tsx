import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, ArrowLeft, CheckCircle, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PasswordStrengthIndicator, validatePasswordStrength } from '@/components/auth/PasswordStrengthIndicator';

export default function Auth() {
  const { signIn, signUp, signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // CRITICAL: Capture hash IMMEDIATELY before Supabase can clear it
  // This must be at the top level, not in a useEffect
  const [initialHashState] = useState(() => {
    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.substring(1));
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    console.log('Initial hash captured:', type, 'hasAccessToken:', !!accessToken, 'full hash:', hash.substring(0, 100));
    return { 
      type, 
      isOAuthCallback: !!accessToken,
      isRecovery: type === 'recovery'
    };
  });
  
  // Track if we're still processing the OAuth callback
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(initialHashState.isOAuthCallback);

  // Capture referral code from URL and allow manual entry
  const [referralCode, setReferralCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      // Store in sessionStorage so it persists through the signup flow
      sessionStorage.setItem('referral_code', ref);
      console.log('Referral code captured:', ref);
      return ref;
    }
    return sessionStorage.getItem('referral_code') || '';
  });
  
  // If we detected recovery in the initial hash, start in recovery mode
  const [isRecoveryMode, setIsRecoveryMode] = useState(() => initialHashState.isRecovery);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [activeTab, setActiveTab] = useState('signup');

  // Single effect to handle all auth state - prevents race conditions
  useEffect(() => {
    // Check URL params for non-recovery flows
    const queryParams = new URLSearchParams(window.location.search);
    const confirmed = queryParams.get('confirmed');
    const tab = queryParams.get('tab');
    
    if (confirmed === 'true') {
      setActiveTab('signin');
    } else if (tab === 'signin' || tab === 'signup') {
      setActiveTab(tab);
    }
    
    // Set up auth state listener - this is the OFFICIAL way to detect password recovery
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, 'session:', !!session, 'isOAuthCallback:', initialHashState.isOAuthCallback);
      
      if (event === 'PASSWORD_RECOVERY') {
        // This is the official Supabase event for password recovery
        console.log('PASSWORD_RECOVERY event - showing reset form');
        setIsRecoveryMode(true);
        setError(null);
      } else if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session)) {
        // Mark OAuth processing as complete when we get a confirmed sign-in
        // CRITICAL: Also handle INITIAL_SESSION because Supabase may process the
        // OAuth hash fragment BEFORE this listener is set up (during createClient).
        // In that case SIGNED_IN fires before we're listening, and we only receive
        // INITIAL_SESSION with the already-established session.
        setIsProcessingOAuth(false);
        console.log(`${event} event - OAuth processing complete, session:`, !!session);
      } else if (event === 'USER_UPDATED') {
        // Password was successfully updated
        console.log('USER_UPDATED event - password changed');
      }
    });
    
    // Also check the URL hash for recovery type as a fallback
    // (in case the PASSWORD_RECOVERY event fires before our listener is set up)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      console.log('Recovery type detected in URL hash');
      setIsRecoveryMode(true);
    } else if (type === 'signup' || type === 'email_confirmation') {
      setEmailConfirmed(true);
      setActiveTab('signin');
    }
    
    return () => subscription.unsubscribe();
  }, []);

  // Separate effect for redirect logic - only runs when user state changes
  useEffect(() => {
    // CRITICAL: Use the initially captured hash type to prevent redirect during recovery
    if (isRecoveryMode || initialHashState.isRecovery) {
      console.log('Recovery mode active - blocking redirect');
      return;
    }
    
    // CRITICAL: Don't redirect while OAuth callback is still being processed
    // This prevents the loop where we redirect before session is fully established
    if (isProcessingOAuth) {
      console.log('OAuth callback in progress - blocking redirect');
      return;
    }
    
    // CRITICAL: Don't redirect while auth is still loading
    // This prevents premature redirects before session is fully established
    if (loading) {
      console.log('Auth still loading - blocking redirect');
      return;
    }
    
    // Redirect authenticated users (only for non-recovery flows)
    if (user) {
      console.log('User authenticated, checking profile for redirect');
      const checkAndRedirect = async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        
        if (!profile?.username) {
          console.log('No username, redirecting to /setup');
          navigate('/setup');
        } else {
          const from = (location.state as any)?.from?.pathname || '/';
          console.log('Redirecting to:', from);
          navigate(from);
        }
      };
      checkAndRedirect();
    }
  }, [user, loading, isRecoveryMode, isProcessingOAuth, navigate, location]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signIn(loginEmail, loginPassword);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setRegisteredEmail(loginEmail);
          setError('email_not_confirmed');
        } else {
          setError(error.message);
        }
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    const passwordValidation = validatePasswordStrength(signupPassword);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message || 'Password does not meet security requirements.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await signUp(signupEmail, signupPassword, {
        full_name: fullName.trim() || undefined
      });

      console.log('Signup response:', { 
        error, 
        hasUser: !!data?.user,
        userId: data?.user?.id,
        userEmail: data?.user?.email,
        identities: data?.user?.identities?.length 
      });

      if (error) {
        // Check for various duplicate user error messages
        if (error.message.includes('User already registered') || 
            error.message.includes('already been registered') ||
            error.message.includes('already exists')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Password should be at least')) {
          setError('Password must meet all security requirements above.');
        } else {
          setError(error.message);
        }
        return;
      }

      // When email confirmation is enabled, Supabase returns a user object with empty identities
      // for duplicate signups (to prevent email enumeration). Catch this case:
      if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
        setError('An account with this email already exists. Please sign in instead.');
        return;
      }

      // If there's a referral code, track it
      if (referralCode && data?.user) {
        try {
          // Find the referrer by their referral code
          const { data: referrerProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', referralCode)
            .single();

          if (referrerProfile) {
            // Create referral record
            await supabase.from('referrals').insert({
              referrer_id: referrerProfile.id,
              referred_id: data.user.id,
              referral_code: referralCode,
              status: 'signed_up',
              converted_at: new Date().toISOString(),
            });

            // Update the new user's profile with referred_by
            await supabase
              .from('profiles')
              .update({ referred_by: referrerProfile.id })
              .eq('id', data.user.id);

            console.log('Referral tracked successfully');
          }
        } catch (refError) {
          // Don't block signup if referral tracking fails
          console.error('Error tracking referral:', refError);
        }
        // Clear the referral code from session
        sessionStorage.removeItem('referral_code');
      }

      // Show prominent confirmation message
      setRegisteredEmail(signupEmail);
      setShowEmailConfirmation(true);

      toast({
        title: "Account created!",
        description: "Please check your email for a confirmation link.",
      });

      // Clear form
      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirmPassword('');
      setFullName('');
      
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setError('Failed to sign in with Google. Please try again.');
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const emailToReset = resetEmail || loginEmail;
    
    if (!emailToReset) {
      setError('Please enter your email address first.');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setShowPasswordReset(true);
      setIsForgotPasswordMode(false);
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message || 'Password does not meet security requirements.');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        // Handle specific error cases with user-friendly messages
        const errorLower = error.message.toLowerCase();
        
        if (errorLower.includes('session') || 
            errorLower.includes('not authenticated') ||
            errorLower.includes('jwt')) {
          setError('Your password reset link has expired. Please request a new one.');
        } else if (errorLower.includes('weak') || 
                   errorLower.includes('password') && errorLower.includes('security') ||
                   errorLower.includes('pwned') ||
                   errorLower.includes('breach') ||
                   errorLower.includes('compromised')) {
          // Password was rejected by Supabase's leaked password protection
          setError('This password has been found in a data breach. Please choose a different password that hasn\'t been compromised.');
        } else {
          setError(error.message);
        }
        return;
      }

      toast({
        title: "Password updated!",
        description: "Your password has been successfully changed.",
      });

      // Clear the form and redirect
      setNewPassword('');
      setConfirmNewPassword('');
      setIsRecoveryMode(false);
      window.history.replaceState(null, '', window.location.pathname);
      navigate('/');
    } catch (err: any) {
      console.error('Password update error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show password reset form
  if (isRecoveryMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to BountyBay
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Reset Your Password</CardTitle>
              <CardDescription className="text-center">
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter your new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {newPassword && <PasswordStrengthIndicator password={newPassword} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="confirm-new-password"
                      type="password"
                      placeholder="Confirm your new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show password reset confirmation message
  if (showPasswordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to BountyBay
            </Link>
          </div>

          <Card className="border-2 border-success/20 bg-success/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-success/20 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-success" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Check Your Email</h2>
                  <p className="text-muted-foreground">
                    We've sent a password reset link to:
                  </p>
                  <p className="font-semibold text-foreground text-lg">{resetEmail}</p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
                  <h3 className="font-semibold text-sm text-foreground">What to do next:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Check your email inbox for the password reset link</li>
                    <li>• Look in your spam/junk folder if you don't see it</li>
                    <li>• Click the link to set a new password</li>
                    <li>• Then return here to sign in</li>
                  </ul>
                </div>

                <div className="space-y-3 pt-4">
                  <Button 
                    onClick={() => setShowPasswordReset(false)}
                    variant="outline" 
                    className="w-full"
                  >
                    Back to Sign In
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    Didn't receive an email? It may take a few minutes to arrive.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show email confirmation message
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to BountyBay
            </Link>
          </div>

          <Card className="border-2 border-success/20 bg-success/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-success/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Check Your Email</h2>
                  <p className="text-muted-foreground">
                    We've sent a confirmation link to:
                  </p>
                  <p className="font-semibold text-foreground text-lg">{registeredEmail}</p>
                </div>

                <div className="bg-muted rounded-lg p-4 text-left space-y-2">
                  <h3 className="font-semibold text-sm text-foreground">What to do next:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Check your email inbox for a confirmation message</li>
                    <li>• Look in your spam/junk folder if you don't see it</li>
                    <li>• Click the confirmation link to activate your account</li>
                    <li>• Then return here to sign in</li>
                  </ul>
                </div>

                <div className="space-y-3 pt-4">
                  <Button 
                    onClick={() => setShowEmailConfirmation(false)}
                    variant="outline" 
                    className="w-full"
                  >
                    Back to Sign In
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    Didn't receive an email? It may take a few minutes to arrive.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to BountyBay
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to BountyBay</h1>
          <p className="text-muted-foreground">Sign in to your account or create a new one</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Get Started</CardTitle>
            <CardDescription className="text-center">
              Join our community of bounty hunters and posters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="signin">Sign In</TabsTrigger>
              </TabsList>
              
              {emailConfirmed && (
                <Alert className="mt-4 bg-success/10 text-success border-success/20">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Email confirmed! You can now sign in to your account.
                  </AlertDescription>
                </Alert>
              )}
              
              {error && error !== 'email_not_confirmed' && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {error === 'email_not_confirmed' && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription className="space-y-3">
                    <p className="font-semibold">Email not confirmed</p>
                    <p className="text-sm">Your confirmation link may have expired. Click below to receive a new one:</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={async () => {
                        setIsLoading(true);
                        const { error } = await supabase.auth.resend({
                          type: 'signup',
                          email: registeredEmail,
                        });
                        setIsLoading(false);
                        if (!error) {
                          toast({
                            title: "Email sent!",
                            description: "Check your inbox for a new confirmation link.",
                          });
                          setError(null);
                        } else {
                          toast({
                            title: "Error",
                            description: "Failed to resend email. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Resend confirmation email'
                      )}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin" className="space-y-4">
                {/* Google Sign In */}
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  {/* Password field - hide when in forgot password mode */}
                  {!isForgotPasswordMode && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgotPasswordMode(true);
                            setLoginPassword('');
                            setResetEmail(loginEmail);
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pl-10"
                          required={!isForgotPasswordMode}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Show back button when in forgot password mode */}
                  {isForgotPasswordMode && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsForgotPasswordMode(false);
                        setResetEmail('');
                      }}
                      className="w-full"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Sign In
                    </Button>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                    onClick={(e) => {
                      if (isForgotPasswordMode) {
                        e.preventDefault();
                        if (!loginEmail) {
                          setError('Please enter your email address first');
                          return;
                        }
                        setResetEmail(loginEmail);
                        handlePasswordReset(e);
                      }
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isForgotPasswordMode ? 'Sending Reset Link...' : 'Signing In...'}
                      </>
                    ) : (
                      isForgotPasswordMode ? 'Send Reset Link' : 'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                {/* Google Sign In */}
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name (Optional)</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a strong password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <PasswordStrengthIndicator password={signupPassword} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Referral Code - optional */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-referral" className="flex items-center gap-1.5">
                      <Gift className="h-3.5 w-3.5 text-primary" />
                      Referral Code (Optional)
                    </Label>
                    <Input
                      id="signup-referral"
                      type="text"
                      placeholder="Enter a referral code if you have one"
                      value={referralCode}
                      onChange={(e) => {
                        const code = e.target.value.toUpperCase();
                        setReferralCode(code);
                        if (code) {
                          sessionStorage.setItem('referral_code', code);
                        } else {
                          sessionStorage.removeItem('referral_code');
                        }
                      }}
                      className="font-mono"
                      disabled={isLoading}
                      maxLength={20}
                    />
                    {referralCode && (
                      <p className="text-xs text-muted-foreground">
                        You'll be connected to the referrer when you sign up!
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}