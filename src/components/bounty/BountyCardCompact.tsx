import { Link } from 'react-router-dom';
import { Image as ImageIcon, Package, Link2, MapPin, Eye, BadgeCheck, Star, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CurrencyDisplayCompact } from '@/components/ui/currency-display';
import { SafeImage } from '@/components/ui/safe-image';
import { SaveBountyButton } from './SaveBountyButton';
import { Bounty, BountyStatus, BountyCategory } from '@/lib/types';
import lostMediaPlaceholder from '@/assets/lost-media-placeholder.jpg';
import { formatDistanceToNowStrict } from 'date-fns';

interface BountyCardCompactProps {
  bounty: Bounty;
  isSaved?: boolean;
  onToggleSave?: () => void;
  showSaveButton?: boolean;
}

export function BountyCardCompact({ bounty, isSaved = false, onToggleSave, showSaveButton = true }: BountyCardCompactProps) {
  const imageContent = bounty.images && bounty.images.length > 0 ? (
    <SafeImage
      src={bounty.images[0]}
      alt={bounty.title}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      fallbackClassName="w-full h-full"
      showFallbackIcon={true}
    />
  ) : bounty.category === BountyCategory.LOST_MEDIA_THREADS ? (
    <img src={lostMediaPlaceholder} alt="Lost Media" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
      <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
    </div>
  );

  return (
    <Link
      to={`/b/${bounty.id}`}
      className="block group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
    >
      <div className="rounded-lg border border-border bg-card overflow-hidden transition-shadow duration-200 hover:shadow-md">
        {/* Image with overlays */}
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {imageContent}

          {/* Top-left: Status badge */}
          {bounty.status === BountyStatus.OPEN && (
            <Badge className="absolute top-1.5 left-1.5 bg-green-500 text-white hover:bg-green-600 text-[10px] px-1.5 py-0 h-5 shadow-sm">
              Open
            </Badge>
          )}

          {/* Bottom-right: Save button */}
          {showSaveButton && onToggleSave && (
            <div className="absolute bottom-1 right-1">
              <SaveBountyButton
                isSaved={isSaved}
                onToggle={onToggleSave}
                size="sm"
                className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background"
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2.5 space-y-1">
          {/* Price */}
          <CurrencyDisplayCompact
            amount={bounty.bountyAmount}
            className="bounty-amount font-bold text-xs px-2 py-0.5"
          />

          {/* Title */}
          <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {bounty.title}
          </h3>

          {/* Badges row */}
          <div className="flex items-center gap-1 flex-wrap">
            {bounty.requires_shipping ? (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-600 gap-0.5">
                <Package className="h-2.5 w-2.5" />
                Ship
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-600 gap-0.5">
                <Link2 className="h-2.5 w-2.5" />
                Lead
              </Badge>
            )}
          </div>

          {/* Poster row: Official badge OR poster name + rating */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground min-w-0">
            {bounty.isOfficial ? (
              <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] px-1.5 py-0 h-5 gap-0.5">
                <BadgeCheck className="h-2.5 w-2.5" />
                Official
              </Badge>
            ) : (
              <>
                <span className="truncate font-medium text-foreground">{bounty.posterName}</span>
                {bounty.posterRatingCount > 0 ? (
                  <span className="flex items-center gap-0.5 shrink-0">
                    <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                    <span>{bounty.posterRating.toFixed(1)}</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground/60">New</span>
                )}
              </>
            )}
          </div>

          {/* Meta row: location + deadline + views */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {bounty.location && (
                <div className="flex items-center gap-0.5 min-w-0">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate max-w-[60px]">{bounty.location}</span>
                </div>
              )}
              {bounty.deadline && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNowStrict(new Date(bounty.deadline), { addSuffix: false })}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-0.5 shrink-0 ml-1">
              <Eye className="h-3 w-3" />
              <span>{bounty.viewsCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
