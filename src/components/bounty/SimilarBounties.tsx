import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { BountyCardCompact } from './BountyCardCompact';
import { supabaseApi } from '@/lib/api/supabase';
import { useSavedBounties } from '@/hooks/use-saved-bounties';
import { Bounty } from '@/lib/types';

interface SimilarBountiesProps {
  bountyId: string;
  category?: string;
}

export function SimilarBounties({ bountyId, category }: SimilarBountiesProps) {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSaved, toggleSave } = useSavedBounties();

  useEffect(() => {
    const load = async () => {
      try {
        const filters = category ? { category: category as any } : {};
        const response = await supabaseApi.getBounties(1, 10, filters);
        // Filter out current bounty
        setBounties(response.data.filter(b => b.id !== bountyId).slice(0, 8));
      } catch (error) {
        console.error('Error loading similar bounties:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bountyId, category]);

  if (loading || bounties.length === 0) return null;

  return (
    <section className="mt-10 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Similar Bounties</h2>
        <Link
          to={category ? `/?category=${category}` : '/bounties'}
          className="text-sm text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
        {bounties.map((bounty) => (
          <div key={bounty.id} className="flex-shrink-0 w-40 sm:w-48">
            <BountyCardCompact
              bounty={bounty}
              isSaved={isSaved(bounty.id)}
              onToggleSave={() => toggleSave(bounty.id)}
              showSaveButton={true}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
