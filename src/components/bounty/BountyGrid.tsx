import { BountyCard } from './BountyCard';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Bounty } from '@/lib/types';
import { Package, Search } from 'lucide-react';

interface BountyGridProps {
  bounties: Bounty[];
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
}

export function BountyGrid({ 
  bounties, 
  loading = false, 
  emptyMessage = "No bounties found",
  emptyDescription = "Try adjusting your search filters or check back later for new bounties."
}: BountyGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (bounties.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={emptyMessage}
        description={emptyDescription}
        className="col-span-full py-12"
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bounties.map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} />
        ))}
      </div>
      
      {/* Screen reader summary */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Showing {bounties.length} bounties
      </div>
    </>
  );
}