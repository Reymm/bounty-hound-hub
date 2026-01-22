import { useState } from 'react';
import { Mail, Chrome, Link2, Check, Plus, Lock, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { PasswordStrengthIndicator, validatePasswordStrength } from '@/components/auth/PasswordStrengthIndicator';

interface ConnectedAccountsProps {
  user: User;
}

export function ConnectedAccounts({ user }: ConnectedAccountsProps) {
  const { toast } = useToast();
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [showSetPasswordDialog, setShowSetPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  // Check which providers are linked
  const identities = user.identities || [];
  const hasEmail = identities.some(i => i.provider === 'email');
  const hasGoogle = identities.some(i => i.provider === 'google');

  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    try {
      const { error } = await supabase.auth.linkIdentity({ 
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/me/profile`
        }
      });
      
      if (error) {
        toast({
          title: "Failed to link Google",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Failed to link Google",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      toast({
        title: "Weak password",
        description: validation.message || "Please use a stronger password.",
        variant: "destructive",
      });
      return;
    }

    setIsSettingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: "Failed to set password",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Password set!",
        description: "You can now sign in with your email and password.",
      });

      setShowSetPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
      
      // Refresh the page to update the identities
      window.location.reload();
    } catch (err) {
      toast({
        title: "Failed to set password",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSettingPassword(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            Manage how you sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email/Password */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Email & Password</p>
                <p className="text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            {hasEmail ? (
              <Badge className="bg-success/10 text-success border-success/20">
                <Check className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSetPasswordDialog(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Set Password
              </Button>
            )}
          </div>

          {/* Google */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium">Google</p>
                <p className="text-sm text-muted-foreground">
                  {hasGoogle ? 'Sign in quickly with Google' : 'Link your Google account'}
                </p>
              </div>
            </div>
            {hasGoogle ? (
              <Badge className="bg-success/10 text-success border-success/20">
                <Check className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLinkGoogle}
                disabled={isLinkingGoogle}
              >
                {isLinkingGoogle ? (
                  'Connecting...'
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Connect
                  </>
                )}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Connecting multiple sign-in methods allows you to access your account in different ways.
          </p>
        </CardContent>
      </Card>

      {/* Set Password Dialog */}
      <Dialog open={showSetPasswordDialog} onOpenChange={setShowSetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set a Password</DialogTitle>
            <DialogDescription>
              Add a password to your account so you can sign in with email and password in addition to Google.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isSettingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword && <PasswordStrengthIndicator password={newPassword} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isSettingPassword}
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-destructive">Passwords don't match</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSetPasswordDialog(false)}
                disabled={isSettingPassword}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSettingPassword || !newPassword || !confirmPassword}
              >
                {isSettingPassword ? 'Setting Password...' : 'Set Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
