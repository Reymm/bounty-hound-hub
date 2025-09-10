import { Link } from 'react-router-dom';
import { Calendar, MapPin, Eye, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bounty, BountyStatus } from '@/lib/types';
import { formatCurrency, formatTimeRemaining } from '@/lib/utils';

interface BountyCardMobileProps {
  bounty: Bounty;
  onViewDetails: () => void;
}

export function BountyCardMobile({ bounty, onViewDetails }: BountyCardMobileProps) {
  const isExpired = bounty.deadline && new Date(bounty.deadline) < new Date();
  const timeRemaining = bounty.deadline ? formatTimeRemaining(bounty.deadline) : null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-card border-border">
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
            
            <div className="text-xl font-bold text-primary ml-3">
              {formatCurrency(bounty.bountyAmount)}
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
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={bounty.status === BountyStatus.OPEN ? 'default' : bounty.status === BountyStatus.FULFILLED ? 'secondary' : 'outline'}
              className="capitalize text-xs"
            >
              {bounty.status}
            </Badge>
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