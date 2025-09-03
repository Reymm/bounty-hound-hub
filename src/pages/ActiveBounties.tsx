import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TrendingUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BountyGrid } from '@/components/bounty/BountyGrid';
import { SearchFilters } from '@/components/filters/SearchFilters';
import { supabaseApi } from '@/lib/api/supabase';
import { Bounty, SearchFilters as SearchFiltersType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const ActiveBounties = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [topBounties, setTopBounties] = useState<Bounty[]>([]);
  const [allBounties, setAllBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [topBountiesLoading, setTopBountiesLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  // Initialize filters from URL params
  useEffect(() => {
    const keyword = searchParams.get('search');
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    
    const urlFilters: SearchFiltersType = {};
    if (keyword) urlFilters.keyword = keyword;
    if (category) urlFilters.category = category as any;
    if (location) urlFilters.location = location;
    
    setFilters(urlFilters);
  }, [searchParams]);

  // Load top bounties (sorted by bounty amount)
  const loadTopBounties = async () => {
    try {
      setTopBountiesLoading(true);
      const response = await supabaseApi.getBounties(1, 6, {});
      // Sort by bounty amount descending for "top" bounties
      const sortedByAmount = response.data.sort((a, b) => b.bountyAmount - a.bountyAmount);
      setTopBounties(sortedByAmount);
    } catch (error) {
      console.error('Error loading top bounties:', error);
      toast({
        title: "Error loading top bounties",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setTopBountiesLoading(false);
    }
  };

  // Load filtered bounties
  const loadBounties = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const response = await supabaseApi.getBounties(currentPage, 20, filters);
      
      if (reset) {
        setAllBounties(response.data);
        setPage(2);
      } else {
        setAllBounties(prev => [...prev, ...response.data]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Error loading bounties:', error);
      toast({
        title: "Error loading bounties",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load top bounties on mount
  useEffect(() => {
    loadTopBounties();
  }, []);

  // Load filtered bounties when filters change
  useEffect(() => {
    loadBounties(true);
  }, [filters]);

  const handleFiltersChange = (newFilters: SearchFiltersType) => {
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.keyword) params.set('search', newFilters.keyword);
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.location) params.set('location', newFilters.location);
    
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-success/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Active Bounties
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover high-value opportunities and find exactly what people are looking for
            </p>
          </div>
        </div>
      </section>

      {/* Top Bounties Section */}
      <section className="py-8 lg:py-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
              Top Bounties
            </h2>
          </div>
          <p className="text-muted-foreground mb-8">
            The highest value bounties currently available
          </p>
          
          <BountyGrid 
            bounties={topBounties}
            loading={topBountiesLoading}
            emptyMessage="No top bounties available"
            emptyDescription="Check back later for high-value opportunities."
          />
        </div>
      </section>

      <Separator className="my-0" />

      {/* All Bounties Section with Filters */}
      <section className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Filter className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                  Browse All Bounties
                </h2>
                <p className="text-muted-foreground mt-1">
                  Search and filter to find the perfect opportunities
                </p>
              </div>
            </div>
            
            <SearchFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
            />
          </div>

          <BountyGrid 
            bounties={allBounties}
            loading={loading && page === 1}
            emptyMessage="No bounties match your criteria"
            emptyDescription="Try adjusting your filters or check back later for new bounties."
          />

          {/* Load More */}
          {hasMore && allBounties.length > 0 && (
            <div className="mt-8 text-center">
              <Button 
                onClick={() => loadBounties(false)}
                disabled={loading}
                variant="outline"
                size="lg"
              >
                {loading ? 'Loading...' : 'Load More Bounties'}
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ActiveBounties;