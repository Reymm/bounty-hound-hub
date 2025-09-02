import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function KycComplete() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'checking' | 'verified' | 'pending' | 'failed'>('checking');
  const [isReturnToPost, setIsReturnToPost] = useState(false);

  useEffect(() => {
    checkVerificationStatus();
    // Check if user was in the middle of posting a bounty
    const returnToPost = sessionStorage.getItem('bounty_post_in_progress');
    if (returnToPost) {
      setIsReturnToPost(true);
    }
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const { data: kycData, error } = await supabase.functions.invoke('check-kyc-status');
      
      if (error) throw error;
      
      setStatus(kycData.status);
      
      if (kycData.verified) {
        toast({
          title: "Identity verified!",
          description: "Your identity has been successfully verified.",
        });
        // Clear the bounty post flag since KYC is complete
        sessionStorage.removeItem('bounty_post_in_progress');
      }
      
    } catch (error: any) {
      console.error('Error checking KYC status:', error);
      setStatus('failed');
      toast({
        title: "Error checking verification",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleReturnToPost = () => {
    navigate('/post-bounty');
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'failed':
        return <XCircle className="h-8 w-8 text-red-500" />;
      case 'pending':
        return <Clock className="h-8 w-8 text-yellow-500" />;
      default:
        return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'verified':
        return {
          title: "Identity Verified Successfully!",
          description: "Your identity has been verified. You can now post bounties of any amount."
        };
      case 'failed':
        return {
          title: "Verification Failed",
          description: "There was an issue verifying your identity. Please try again or contact support."
        };
      case 'pending':
        return {
          title: "Verification In Progress",
          description: "Your identity verification is still being processed. This may take a few minutes."
        };
      default:
        return {
          title: "Checking Verification Status",
          description: "Please wait while we check your verification status..."
        };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Identity Verification</h1>
        <p className="text-muted-foreground">
          Verification status for your BountyBay account
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 justify-center">
            <Shield className="h-6 w-6" />
            KYC Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            {getStatusIcon()}
            <div>
              <h3 className="text-lg font-semibold">{statusMessage.title}</h3>
              <p className="text-muted-foreground">{statusMessage.description}</p>
            </div>
          </div>

          {status === 'pending' && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Identity verification can take a few minutes to complete. You can close this window and we'll notify you when it's ready.
              </AlertDescription>
            </Alert>
          )}

          {status === 'failed' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                If you continue to experience issues, please ensure your documents are clear and match your information exactly.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {status === 'pending' && (
              <Button onClick={checkVerificationStatus} variant="outline">
                Check Status Again
              </Button>
            )}
            
            {status === 'verified' && isReturnToPost && (
              <Button onClick={handleReturnToPost} className="bg-primary hover:bg-primary-hover">
                Continue Posting Bounty
              </Button>
            )}
            
            {status === 'failed' && (
              <Button onClick={() => navigate('/post-bounty')} variant="outline">
                Try Verification Again
              </Button>
            )}
            
            <Button onClick={handleReturnHome} variant="outline">
              Return to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}