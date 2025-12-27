import { Link } from 'react-router-dom';
import { Calendar, MapPin, Star, Eye, Users, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bounty, BountyStatus } from '@/lib/types';
import { formatDistanceToNow, isAfter, subDays } from 'date-fns';
import { SaveBountyButton } from './SaveBountyButton';

interface BountyCardProps {
  bounty: Bounty;
  isSaved?: boolean;
  onToggleSave?: () => void;
  showSaveButton?: boolean;
}

export function BountyCard({ bounty, isSaved = false, onToggleSave, showSaveButton = true }: BountyCardProps) {
  const isUrgent = bounty.deadline ? isAfter(new Date(), subDays(bounty.deadline, 3)) : false;
  const isSoon = bounty.deadline ? isAfter(new Date(), subDays(bounty.deadline, 7)) && !isUrgent : false;
  
  const getStatusBadge = () => {
    switch (bounty.status) {
      case BountyStatus.OPEN:
        return <Badge className="bg-green-500 text-white hover:bg-green-600">Open</Badge>;
      case BountyStatus.CLAIMED:
        return <Badge className="status-pending">Claimed</Badge>;
      case BountyStatus.FULFILLED:
        return <Badge className="status-completed">Fulfilled</Badge>;
      default:
        return <Badge variant="secondary">{bounty.status}</Badge>;
    }
  };

  const getDeadlineBadge = () => {
    if (!bounty.deadline) {
      return (
        <Badge variant="outline" className="text-xs deadline-normal">
          <Calendar className="h-3 w-3 mr-1" />
          No deadline
        </Badge>
      );
    }
    
    const timeLeft = formatDistanceToNow(bounty.deadline, { addSuffix: true });
    const className = isUrgent ? 'deadline-urgent' : isSoon ? 'deadline-soon' : 'deadline-normal';
    
    return (
      <Badge variant="outline" className={`text-xs ${className}`}>
        <Calendar className="h-3 w-3 mr-1" />
        {timeLeft}
      </Badge>
    );
  };

  return (
    <Card className="card-hover focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 transition-all duration-200 overflow-hidden">
      <CardContent className="p-0">
        {/* Image Thumbnail */}
        {bounty.images && bounty.images.length > 0 ? (
          <Link to={`/b/${bounty.id}`} className="block">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
              <img
                src={bounty.images[0]}
                alt={bounty.title}
                className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
              />
            </div>
          </Link>
        ) : (
          <Link to={`/b/${bounty.id}`} className="block">
            <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No image</p>
              </div>
            </div>
          </Link>
        )}
        
        <div className="p-4 space-y-3">
          {/* Header with status and bounty amount */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {showSaveButton && onToggleSave && (
                <SaveBountyButton isSaved={isSaved} onToggle={onToggleSave} />
              )}
            </div>
            <div className="text-right">
              <div className="bounty-amount font-bold">
                ${bounty.bountyAmount.toLocaleString()}
              </div>
              {bounty.targetPriceMin && bounty.targetPriceMax && (
                <div className="text-xs text-muted-foreground">
                  Item: ${bounty.targetPriceMin.toLocaleString()}-${bounty.targetPriceMax.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <Link 
            to={`/b/${bounty.id}`}
            className="block group focus:outline-none"
            aria-describedby={`bounty-${bounty.id}-details`}
          >
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
              {bounty.title}
            </h3>
          </Link>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {bounty.description}
          </p>

          {/* Tags */}
          {bounty.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {bounty.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {bounty.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{bounty.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Meta information */}
          <div 
            id={`bounty-${bounty.id}-details`}
            className="flex items-center justify-between text-xs text-muted-foreground"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-24">{bounty.location}</span>
              </div>
              
              <div className="flex items-center gap-1">
                {bounty.posterRatingCount > 0 ? (
                  <>
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span>{bounty.posterRating.toFixed(1)}</span>
                    <span className="text-muted-foreground/60">({bounty.posterRatingCount})</span>
                  </>
                ) : (
                  <Badge variant="secondary" className="text-xs">New</Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1" title={`${bounty.claimsCount} claims`}>
                <Users className="h-3 w-3" />
                <span>{bounty.claimsCount}</span>
              </div>
              
              <div className="flex items-center gap-1" title={`${bounty.viewsCount} views`}>
                <Eye className="h-3 w-3" />
                <span>{bounty.viewsCount}</span>
              </div>
            </div>
          </div>

          {/* Footer with deadline and poster */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            {getDeadlineBadge()}
            
            <div className="text-xs text-muted-foreground">
              by <Link 
                to={`/u/${bounty.posterId}`}
                className="font-medium text-foreground hover:text-primary transition-colors hover:underline"
              >
                {bounty.posterName}
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
