import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type VerificationStatus = "checking" | "verified" | "pending" | "processing" | "canceled" | "failed";

export default function IdentityComplete() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>("checking");
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-identity-status");
      
      if (error) throw error;

      if (data.verified) {
        setStatus("verified");
        toast.success("Identity verified successfully!");
      } else if (data.status === "processing") {
        setStatus("processing");
      } else if (data.status === "canceled") {
        setStatus("canceled");
      } else {
        setStatus("pending");
      }
    } catch (error: any) {
      console.error("Error checking status:", error);
      setStatus("failed");
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Poll for status updates
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case "checking":
        return <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />;
      case "verified":
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case "processing":
        return <Clock className="h-12 w-12 text-yellow-500" />;
      case "pending":
        return <RefreshCw className="h-12 w-12 text-blue-500" />;
      case "canceled":
      case "failed":
        return <XCircle className="h-12 w-12 text-destructive" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "checking":
        return {
          title: "Checking Verification Status",
          description: "Please wait while we check your identity verification status..."
        };
      case "verified":
        return {
          title: "Identity Verified!",
          description: "Your identity has been successfully verified. You can now claim bounties on BountyBay."
        };
      case "processing":
        return {
          title: "Verification Processing",
          description: "Your documents are being reviewed. This usually takes a few minutes."
        };
      case "pending":
        return {
          title: "Verification Incomplete",
          description: "Your identity verification wasn't completed. Please try again."
        };
      case "canceled":
        return {
          title: "Verification Canceled",
          description: "The verification was canceled. You can start a new verification when you're ready."
        };
      case "failed":
        return {
          title: "Verification Failed",
          description: "There was an issue with your verification. Please try again or contact support."
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="container max-w-lg mx-auto py-16 px-4">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl">{statusInfo.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            {statusInfo.description}
          </p>

          {status === "verified" && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                You're all set! Your verified status is now active.
              </AlertDescription>
            </Alert>
          )}

          {status === "processing" && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                We'll update this page automatically once verification is complete.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3">
            {status === "verified" && (
              <>
                <Button onClick={() => navigate("/verification")} className="w-full">
                  Continue to Payout Setup
                </Button>
                <Button variant="outline" onClick={() => navigate("/bounties")} className="w-full">
                  Browse Bounties
                </Button>
              </>
            )}

            {(status === "pending" || status === "canceled" || status === "failed") && (
              <>
                <Button onClick={() => navigate("/verification")} className="w-full">
                  Back to Verification
                </Button>
                <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                  Return Home
                </Button>
              </>
            )}

            {(status === "checking" || status === "processing") && (
              <Button 
                variant="outline" 
                onClick={checkStatus} 
                disabled={isChecking}
                className="w-full"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Check Status
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
