import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface VerificationStatusCardProps {
  identityVerified: boolean;
  payoutsEnabled: boolean;
}

export function VerificationStatusCard({ identityVerified, payoutsEnabled }: VerificationStatusCardProps) {
  const fullyVerified = identityVerified && payoutsEnabled;

  return (
    <Card className={`overflow-hidden ${fullyVerified ? 'border-green-500/20' : 'border-yellow-500/20'}`}>
      {/* Header band */}
      <div className={`px-6 py-4 ${fullyVerified ? 'bg-green-50 dark:bg-green-950/30' : 'bg-yellow-50 dark:bg-yellow-950/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${fullyVerified ? 'bg-green-100 dark:bg-green-900/50' : 'bg-yellow-100 dark:bg-yellow-900/50'}`}>
              <ShieldCheck className={`h-5 w-5 ${fullyVerified ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
            </div>
            <span className="font-semibold text-foreground">Verification</span>
          </div>
          {fullyVerified ? (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300 text-xs font-medium px-3 py-1">
              Fully Verified
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-300 text-xs font-medium px-3 py-1">
              Incomplete
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-6 space-y-4">
        {/* Identity row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {identityVerified ? (
              <CheckCircle className="h-[18px] w-[18px] text-green-500" />
            ) : (
              <AlertCircle className="h-[18px] w-[18px] text-yellow-500" />
            )}
            <span className="text-sm text-foreground">Identity Verification</span>
          </div>
          <span className={`text-sm font-medium ${identityVerified ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
            {identityVerified ? 'Verified' : 'Pending'}
          </span>
        </div>

        <Separator />

        {/* Payout row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {payoutsEnabled ? (
              <CheckCircle className="h-[18px] w-[18px] text-green-500" />
            ) : (
              <AlertCircle className="h-[18px] w-[18px] text-yellow-500" />
            )}
            <span className="text-sm text-foreground">Payout Setup</span>
          </div>
          <span className={`text-sm font-medium ${payoutsEnabled ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
            {payoutsEnabled ? 'Ready' : 'Pending'}
          </span>
        </div>

        {!fullyVerified && (
          <>
            <Separator />
            <Button asChild size="sm" className="w-full">
              <Link to="/verification">
                Complete Verification
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
