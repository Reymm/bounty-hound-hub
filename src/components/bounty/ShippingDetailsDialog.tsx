import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabaseApi } from '@/lib/api/supabase';
import { Loader2 } from 'lucide-react';

interface ShippingDetailsDialogProps {
  bountyId: string;
  bountyTitle?: string;
  hunterName?: string;
  isOpen: boolean;
  onClose: () => void;
  onShippingDetailsProvided: () => void;
}

interface ShippingDetails {
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  notes?: string;
}

export function ShippingDetailsDialog({ 
  bountyId, 
  bountyTitle, 
  hunterName, 
  isOpen, 
  onClose, 
  onShippingDetailsProvided 
}: ShippingDetailsDialogProps) {
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    name: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof ShippingDetails, value: string) => {
    setShippingDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!shippingDetails.name || !shippingDetails.address || !shippingDetails.city || 
        !shippingDetails.state || !shippingDetails.postalCode || !shippingDetails.country) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required shipping information.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Update bounty with shipping details
      const success = await supabaseApi.updateBountyShippingDetails(bountyId, shippingDetails);
      
      if (success) {
        toast({
          title: "Shipping details provided",
          description: hunterName ? `${hunterName} has been notified with your shipping information.` : "The hunter has been notified with your shipping information.",
        });
        onShippingDetailsProvided();
        onClose();
      } else {
        throw new Error('Failed to update shipping details');
      }
    } catch (error) {
      console.error('Error providing shipping details:', error);
      toast({
        title: "Error",
        description: "Failed to provide shipping details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      // Mark shipping as not_provided
      const success = await supabaseApi.updateBountyShippingStatus(bountyId, 'not_provided');
      
      if (success) {
        toast({
          title: "Shipping details skipped",
          description: "The bounty has been completed without shipping information.",
        });
        onClose();
      } else {
        throw new Error('Failed to update shipping status');
      }
    } catch (error) {
      console.error('Error skipping shipping details:', error);
      toast({
        title: "Error",
        description: "Failed to skip shipping details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevent closing dialog by clicking outside or pressing Escape - user must submit or skip
  const handleOpenChange = (open: boolean) => {
    // Only allow closing if not currently submitting
    if (!open && !isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Shipping Details Required</DialogTitle>
          <DialogDescription>
            {bountyTitle 
              ? `Your bounty "${bountyTitle}" has been fulfilled! Would you like to provide shipping details so ${hunterName || 'the hunter'} can send the item?`
              : `Please provide your shipping address so the hunter can send the item to you.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={shippingDetails.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={shippingDetails.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              value={shippingDetails.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="123 Main Street, Apt 4B"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={shippingDetails.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="New York"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Province *</Label>
              <Input
                id="state"
                value={shippingDetails.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="NY"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Zip/Postal Code *</Label>
              <Input
                id="postalCode"
                value={shippingDetails.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                placeholder="e.g., 10001, M5H 2N2, SW1A 1AA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={shippingDetails.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="United States"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Special Instructions</Label>
            <Textarea
              id="notes"
              value={shippingDetails.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Leave at front door, ring doorbell, etc."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            Skip (No Shipping)
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Provide Shipping Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}