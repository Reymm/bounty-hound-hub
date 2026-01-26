import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
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
  const [showSetPasswordDialog, setShowSetPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  // Check if user has email/password set up
  const identities = user.identities || [];
  const hasEmailPassword = identities.some(i => i.provider === 'email');
  const hasGoogle = identities.some(i => i.provider === 'google');

  // Only show this section for Google-only users who don't have a password yet
  if (hasEmailPassword || !hasGoogle) {
    return null;
  }

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
        // Check for breached password error
        const errorLower = error.message.toLowerCase();
        const isBreachedPassword = errorLower.includes('weak') || 
                                   errorLower.includes('pwned') ||
                                   errorLower.includes('breach') ||
                                   errorLower.includes('compromised');
        
        toast({
          title: "Failed to set password",
          description: isBreachedPassword 
            ? "This password has been found in a data breach. Please choose a different password."
            : error.message,
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
            <KeyRound className="h-5 w-5" />
            Add Password Login
          </CardTitle>
          <CardDescription>
            You signed up with Google. Add a password to also sign in with email.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSetPasswordDialog(true)}
            >
              Set Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Set Password Dialog */}
      <Dialog open={showSetPasswordDialog} onOpenChange={setShowSetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set a Password</DialogTitle>
            <DialogDescription>
              Add a password so you can sign in with email and password in addition to Google.
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
