import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, MapPin, Phone, FileText, AlertCircle, ShieldAlert } from 'lucide-react';
import { ShippingDetails } from '@/lib/types';

interface ShippingInfoCardProps {
  shippingDetails?: ShippingDetails;
  shippingStatus?: string;
  isHunter: boolean;
  isPoster: boolean;
  onProvideShipping?: () => void;
}

export function ShippingInfoCard({ 
  shippingDetails, 
  shippingStatus, 
  isHunter,
  isPoster,
  onProvideShipping
}: ShippingInfoCardProps) {
  // Only show to hunters with accepted claims or to the poster
  if (!isHunter && !isPoster) return null;

  // For poster: show prompt to provide shipping details when not yet requested/provided
  if (isPoster && (shippingStatus === 'not_requested' || shippingStatus === 'requested')) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Shipping Details Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            You've accepted this submission. Please provide your shipping address so the hunter can send the item to you.
          </p>
          <Button onClick={onProvideShipping} className="w-full">
            Provide Shipping Details
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Hide for hunter if shipping not yet requested
  if (isHunter && (shippingStatus === 'not_requested' || shippingStatus === 'not_provided')) {
    return null;
  }

  // Show waiting state for hunter if shipping is requested but not yet provided
  if (isHunter && shippingStatus === 'requested' && !shippingDetails) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Awaiting Shipping Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The bounty poster has been asked to provide shipping details. You'll be notified once they submit the address.
          </p>
        </CardContent>
      </Card>
    );
  }

  // If shipping details are provided, show them
  if (shippingDetails && shippingStatus === 'provided') {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Shipping Address
            </CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Ready to Ship
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 rounded-lg bg-background border">
            <div className="space-y-2">
              <p className="font-semibold text-foreground">{shippingDetails.name}</p>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p>{shippingDetails.address}</p>
                  <p>{shippingDetails.city}, {shippingDetails.state} {shippingDetails.postalCode}</p>
                  <p>{shippingDetails.country}</p>
                </div>
              </div>
              {shippingDetails.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{shippingDetails.phone}</span>
                </div>
              )}
              {shippingDetails.notes && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2 pt-2 border-t">
                  <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground text-xs mb-1">Special Instructions:</p>
                    <p>{shippingDetails.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          {isHunter && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Please ship the item to this address and add tracking information once shipped.
              </p>
              <div className="flex items-start gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Shipping insurance recommended</strong> for items over $100. 
                  BountyBay is not liable for lost or damaged shipments.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}