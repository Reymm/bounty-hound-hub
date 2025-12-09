import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PasswordStrengthIndicator, validatePasswordStrength } from '@/components/auth/PasswordStrengthIndicator';

export default function Auth() {
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
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

  // Check if user is coming from email confirmation or password reset
  useEffect(() => {
    const processAuthHash = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      const type = hashParams.get('type');
      const confirmed = queryParams.get('confirmed');
      const tab = queryParams.get('tab');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      console.log('Auth page load - hash type:', type, 'hasAccessToken:', !!accessToken);
      
      // If we have access_token in the hash with recovery type, process it
      if (accessToken && type === 'recovery') {
        console.log('Processing recovery token from hash');
        // Set recovery mode FIRST before setting session to prevent redirect race condition
        setIsRecoveryMode(true);
        
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });
          
          if (error) {
            console.error('Error setting session from recovery token:', error);
            setError('Password reset link has expired. Please request a new one.');
            setIsRecoveryMode(false);
          } else {
            console.log('Session set successfully from recovery token');
          }
        } catch (err) {
          console.error('Error processing recovery token:', err);
          setError('Password reset link is invalid. Please request a new one.');
          setIsRecoveryMode(false);
        }
        return; // Don't process other logic if in recovery mode
      }
      
      // Check for recovery type in hash params (without token - shouldn't happen but handle it)
      if (type === 'recovery') {
        console.log('Setting recovery mode to true from hash params');
        setIsRecoveryMode(true);
        return;
      } else if (type === 'signup' || type === 'email_confirmation') {
        // Only show confirmed message if we actually got here from email link with proper token
        setEmailConfirmed(true);
        setActiveTab('signin');
        window.history.replaceState(null, '', window.location.pathname);
      } else if (confirmed === 'true') {
        // Don't automatically show success - the token might have expired
        setActiveTab('signin');
        window.history.replaceState(null, '', window.location.pathname);
      } else if (tab === 'signin' || tab === 'signup') {
        setActiveTab(tab);
      }
    };
    
    processAuthHash();
  }, []);
  
  // Separate effect to listen for auth state changes - this catches PASSWORD_RECOVERY event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change event:', event);
      if (event === 'PASSWORD_RECOVERY') {
        console.log('PASSWORD_RECOVERY event detected, setting recovery mode');
        setIsRecoveryMode(true);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Redirect if already authenticated (but not during password recovery)
  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      // Check for recovery indicators in URL - don't redirect if present
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashType = hashParams.get('type');
      const hasAccessToken = hashParams.has('access_token');
      
      // Don't redirect if:
      // 1. We're in recovery mode
      // 2. URL hash contains recovery type
      // 3. URL hash contains access_token (could be any auth flow)
      if (isRecoveryMode || hashType === 'recovery' || hasAccessToken) {
        console.log('Skipping redirect - recovery flow detected');
        return;
      }
      
      if (user) {
        // Check if user has completed profile setup
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', user.id)
          .single();
        
        // If no username, redirect to profile setup
        if (!profile?.username) {
          navigate('/setup');
        } else {
          const from = (location.state as any)?.from?.pathname || '/';
          navigate(from);
        }
      }
    };
    
    checkProfileAndRedirect();
  }, [user, navigate, location, isRecoveryMode]);

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
        redirectTo: `${window.location.origin}/auth#`,
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
      // First verify we have an active session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Auth session missing! The password reset link may have expired. Please request a new one.');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        if (error.message.includes('session')) {
          setError('Session expired. Please request a new password reset link.');
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

                <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
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