import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, CreditCard, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function ConnectComplete() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<'checking' | 'complete' | 'pending' | 'failed'>('checking');
  const [checkCount, setCheckCount] = useState(0);
  
  // Get return URL from query params (for returning to bounty after setup)
  const returnTo = searchParams.get('return_to');

  useEffect(() => {
    checkConnectStatus();
    
    // Auto-refresh status every 3 seconds while pending (max 10 checks)
    const interval = setInterval(() => {
      if ((status === 'pending' || status === 'checking') && checkCount < 10) {
        checkConnectStatus();
        setCheckCount(prev => prev + 1);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [status, checkCount]);

  const checkConnectStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-connect-status');
      
      if (error) throw error;
      
      if (data.onboarding_complete) {
        setStatus('complete');
        toast({
          title: "Payout setup complete!",
          description: "You can now receive payments when your claims are accepted.",
        });
      } else if (data.details_submitted) {
        setStatus('pending');
      } else {
        setStatus('failed');
      }
      
    } catch (error: any) {
      console.error('Error checking Connect status:', error);
      setStatus('failed');
      toast({
        title: "Error checking status",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'failed':
        return <XCircle className="h-8 w-8 text-destructive" />;
      case 'pending':
        return <Clock className="h-8 w-8 text-amber-500" />;
      default:
        return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'complete':
        return {
          title: "Payout Setup Complete!",
          description: "Your bank account is connected and you can now receive payments when bounty posters accept your claims."
        };
      case 'failed':
        return {
          title: "Setup Incomplete",
          description: "There was an issue completing your payout setup. Please try again or contact support."
        };
      case 'pending':
        return {
          title: "Setup In Progress",
          description: "Your payout information is being verified. This may take a few minutes."
        };
      default:
        return {
          title: "Checking Status",
          description: "Please wait while we verify your payout setup..."
        };
    }
  };

  const handleContinue = () => {
    if (returnTo) {
      navigate(returnTo);
    } else {
      navigate('/bounties');
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Payout Setup</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Connect your bank account to receive bounty payments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 justify-center text-base sm:text-lg">
            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <span>Stripe Connect Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            {getStatusIcon()}
            <div>
              <h3 className="text-lg font-semibold">{statusMessage.title}</h3>
              <p className="text-muted-foreground text-sm sm:text-base">{statusMessage.description}</p>
            </div>
          </div>

          {status === 'checking' && (
            <Alert>
              <Clock className="h-4 w-4 flex-shrink-0" />
              <AlertDescription className="text-sm">
                Checking your payout setup with Stripe... This page will update automatically.
              </AlertDescription>
            </Alert>
          )}

          {status === 'pending' && (
            <Alert>
              <Clock className="h-4 w-4 flex-shrink-0" />
              <AlertDescription className="text-sm">
                Your payout setup is being verified. This page will auto-refresh to check your status.
              </AlertDescription>
            </Alert>
          )}

          {status === 'failed' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              <AlertDescription className="text-sm">
                If you continue to experience issues, please ensure all your information is accurate and complete.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3">
            {(status === 'checking' || status === 'pending') && (
              <Button onClick={checkConnectStatus} variant="outline" disabled={status === 'checking'} className="w-full">
                {status === 'checking' ? 'Checking...' : 'Check Status Now'}
              </Button>
            )}
            
            {status === 'complete' && (
              <>
                <Button onClick={handleContinue} className="w-full">
                  {returnTo ? (
                    <>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Return to Bounty
                    </>
                  ) : (
                    'Browse Bounties'
                  )}
                </Button>
                <Button onClick={() => navigate('/verification')} variant="outline" className="w-full">
                  Back to Verification
                </Button>
              </>
            )}
            
            {status === 'failed' && (
              <>
                <Button onClick={() => navigate('/verification')} className="w-full">
                  Try Again
                </Button>
                <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                  Return to Home
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}