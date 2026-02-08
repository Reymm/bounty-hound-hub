import { Link } from 'react-router-dom';
import { Image as ImageIcon, Package, Link2, MapPin, Eye, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CurrencyDisplayCompact } from '@/components/ui/currency-display';
import { SafeImage } from '@/components/ui/safe-image';
import { SaveBountyButton } from './SaveBountyButton';
import { Bounty, BountyStatus } from '@/lib/types';

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
        <div className="p-2.5 space-y-1.5">
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
            {bounty.isOfficial && (
              <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] px-1.5 py-0 h-5 gap-0.5">
                <BadgeCheck className="h-2.5 w-2.5" />
                Official
              </Badge>
            )}
          </div>

          {/* Meta row: location + views */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            {bounty.location && (
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{bounty.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <Eye className="h-3 w-3" />
              <span>{bounty.viewsCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
