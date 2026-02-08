import { Link } from 'react-router-dom';
import { Image as ImageIcon, Package, Link2, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CurrencyDisplayCompact } from '@/components/ui/currency-display';
import { SafeImage } from '@/components/ui/safe-image';
import { Bounty, BountyStatus } from '@/lib/types';

interface BountyCardCompactProps {
  bounty: Bounty;
}

export function BountyCardCompact({ bounty }: BountyCardCompactProps) {
  return (
    <Link
      to={`/b/${bounty.id}`}
      className="block group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
    >
      <div className="rounded-lg border border-border bg-card overflow-hidden transition-shadow duration-200 hover:shadow-md">
        {/* Image */}
        {bounty.images && bounty.images.length > 0 ? (
          <div className="aspect-square w-full overflow-hidden bg-muted">
            <SafeImage
              src={bounty.images[0]}
              alt={bounty.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              fallbackClassName="w-full h-full"
              showFallbackIcon={true}
            />
          </div>
        ) : (
          <div className="aspect-square w-full overflow-hidden bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
          </div>
        )}

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
            {bounty.status === BountyStatus.OPEN && (
              <Badge className="bg-green-500 text-white hover:bg-green-600 text-[10px] px-1.5 py-0 h-5">
                Open
              </Badge>
            )}
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

          {/* Location */}
          {bounty.location && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{bounty.location}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
