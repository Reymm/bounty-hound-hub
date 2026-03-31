import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface VerificationStatusCardProps {
  identityVerified: boolean;
  payoutsEnabled: boolean;
}

export function VerificationStatusCard({ identityVerified, payoutsEnabled }: VerificationStatusCardProps) {
  const fullyVerified = identityVerified && payoutsEnabled;

  return (
    <Card className={fullyVerified ? 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20' : 'border-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-950/20'}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className={`h-5 w-5 ${fullyVerified ? 'text-green-600' : 'text-yellow-600'}`} />
          Verification Status
          {fullyVerified && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
              Fully Verified
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {identityVerified ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
            <span className="text-sm font-medium">Identity Verification</span>
          </div>
          <span className={`text-xs font-medium ${identityVerified ? 'text-green-600' : 'text-yellow-600'}`}>
            {identityVerified ? 'Verified' : 'Pending'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {payoutsEnabled ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
            <span className="text-sm font-medium">Payout Setup</span>
          </div>
          <span className={`text-xs font-medium ${payoutsEnabled ? 'text-green-600' : 'text-yellow-600'}`}>
            {payoutsEnabled ? 'Ready' : 'Pending'}
          </span>
        </div>

        {!fullyVerified && (
          <Button asChild size="sm" className="w-full mt-2">
            <Link to="/verification">
              Complete Verification
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
