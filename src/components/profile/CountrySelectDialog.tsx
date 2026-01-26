import { useState } from 'react';
import { Flag, AlertCircle, FileText, Building2, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface CountrySelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (country: string) => void;
  loading?: boolean;
}

const SUPPORTED_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
];

export function CountrySelectDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: CountrySelectDialogProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [step, setStep] = useState<'country' | 'guidance'>('country');

  const handleContinue = () => {
    if (selectedCountry && step === 'country') {
      setStep('guidance');
    }
  };

  const handleConfirm = () => {
    if (selectedCountry) {
      onConfirm(selectedCountry);
    }
  };

  const handleBack = () => {
    setStep('country');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset to first step when closing
      setStep('country');
      setSelectedCountry('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {step === 'country' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Select Your Country
              </DialogTitle>
              <DialogDescription>
                Choose the country where you'll receive payouts. This cannot be changed after setup.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <RadioGroup
                value={selectedCountry}
                onValueChange={setSelectedCountry}
                className="space-y-3"
              >
                {SUPPORTED_COUNTRIES.map((country) => (
                  <div
                    key={country.code}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedCountry === country.code
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedCountry(country.code)}
                  >
                    <RadioGroupItem value={country.code} id={country.code} />
                    <Label
                      htmlFor={country.code}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <span className="text-2xl">{country.flag}</span>
                      <span className="font-medium">{country.name}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!selectedCountry}
                className="w-full sm:w-auto"
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                What to Expect from Stripe
              </DialogTitle>
              <DialogDescription>
                You'll be redirected to Stripe to verify your identity and set up payouts. Here's what you need to know:
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Info items */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Personal Information</p>
                    <p className="text-sm text-muted-foreground">
                      Name, address, date of birth, and last 4 digits of your SSN/SIN (for tax reporting)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <CreditCard className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Bank Account or Debit Card</p>
                    <p className="text-sm text-muted-foreground">
                      How you want to receive your bounty payouts
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">"Business" Details</p>
                    <p className="text-sm text-muted-foreground">
                      Stripe may ask about your "business" — this just means you as an individual. Select "Individual" as your business type.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Important callout */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium text-amber-800 text-sm">If Stripe asks for a website:</p>
                    <p className="text-sm text-amber-700">
                      We've pre-filled this for you, but if you see it, just enter:
                    </p>
                    <code className="block bg-amber-100 px-3 py-2 rounded text-amber-900 font-mono text-sm select-all">
                      bountybay.lovable.app
                    </code>
                    <p className="text-xs text-amber-600">
                      This is normal for payment platforms — it's how Stripe verifies you're a real person earning income.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                This is required by law for anyone receiving payments online (tax reporting compliance).
              </p>
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? 'Setting up...' : 'Continue to Stripe'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
