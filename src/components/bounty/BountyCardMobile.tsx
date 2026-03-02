import { Link } from 'react-router-dom';
import { Calendar, MapPin, Eye, Clock, BadgeCheck, Package, Link2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CurrencyDisplayCompact } from '@/components/ui/currency-display';
import { SafeImage } from '@/components/ui/safe-image';
import { Bounty, BountyStatus, BountyCategory } from '@/lib/types';
import { getThumbnailUrl } from '@/lib/image-utils';
import lostMediaPlaceholder from '@/assets/lost-media-placeholder.jpg';
import noPhotoPlaceholder from '@/assets/no-photo-placeholder.png';
import { formatTimeRemaining } from '@/lib/utils';
interface BountyCardMobileProps {
  bounty: Bounty;
  onViewDetails: () => void;
}

export function BountyCardMobile({ bounty, onViewDetails }: BountyCardMobileProps) {
  const isExpired = bounty.deadline && new Date(bounty.deadline) < new Date();
  const timeRemaining = bounty.deadline ? formatTimeRemaining(bounty.deadline) : null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-card border-border">
      {/* Image Thumbnail */}
      {bounty.images && bounty.images.length > 0 ? (
        <Link to={`/b/${bounty.id}`} className="block">
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <SafeImage
              src={getThumbnailUrl(bounty.images[0])}
              alt={bounty.title}
              className="w-full h-full object-cover"
              fallbackClassName="w-full h-full"
              showFallbackIcon={true}
            />
          </div>
        </Link>
      ) : bounty.category === BountyCategory.LOST_MEDIA ? (
        <Link to={`/b/${bounty.id}`} className="block">
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <img src={lostMediaPlaceholder} alt="Lost Media" className="w-full h-full object-cover" />
          </div>
        </Link>
      ) : (
        <Link to={`/b/${bounty.id}`} className="block">
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <img
              src={noPhotoPlaceholder}
              alt="No photo provided"
              className="w-full h-full object-cover"
            />
          </div>
        </Link>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <Link 
              to={`/b/${bounty.id}`}
              className="block hover:underline flex-1"
            >
              <h3 className="font-semibold text-base text-foreground line-clamp-2 mb-2">
                {bounty.title}
              </h3>
            </Link>
            
            <div className="text-right ml-3">
              <CurrencyDisplayCompact 
                amount={bounty.bountyAmount} 
                className="text-xl font-bold text-primary"
              />
              {!bounty.requires_shipping && (
                <p className="text-[10px] text-muted-foreground">for a lead</p>
              )}
            </div>
          </div>
          
          <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
            {bounty.description}
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            {bounty.location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="truncate">{bounty.location}</span>
              </div>
            )}
            
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              {bounty.viewsCount}
            </div>
          </div>
          
          {timeRemaining && (
            <div className={`flex items-center ${isExpired ? 'text-destructive' : ''}`}>
              <Clock className="h-4 w-4 mr-1" />
              {isExpired ? 'Expired' : timeRemaining}
            </div>
          )}

          {bounty.createdAt && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(bounty.createdAt).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Badge 
              variant={bounty.status === BountyStatus.OPEN ? 'default' : bounty.status === BountyStatus.FULFILLED ? 'secondary' : 'outline'}
              className="capitalize text-xs"
            >
              {bounty.status}
            </Badge>
            {bounty.requires_shipping ? (
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-600 gap-0.5">
                <Package className="h-3 w-3" />
                Find & Ship
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-600 gap-0.5">
                <Link2 className="h-3 w-3" />
                Lead Only
              </Badge>
            )}
            {bounty.isOfficial && (
              <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs gap-0.5">
                <BadgeCheck className="h-3 w-3" />
                Official
              </Badge>
            )}
            {bounty.category && (
              <Badge variant="outline" className="text-xs">
                {bounty.category}
              </Badge>
            )}
          </div>
          
          <Button size="sm" onClick={onViewDetails} className="w-full">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
