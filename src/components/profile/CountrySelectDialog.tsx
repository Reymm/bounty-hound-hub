import { useState } from 'react';
import { Flag } from 'lucide-react';
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

  const handleConfirm = () => {
    if (selectedCountry) {
      onConfirm(selectedCountry);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedCountry || loading}
          >
            {loading ? 'Setting up...' : 'Continue to Stripe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
