import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BountyGrid } from '@/components/bounty/BountyGrid';
import { SearchFilters } from '@/components/filters/SearchFilters';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { supabaseApi } from '@/lib/api/supabase';
import { Bounty, SearchFilters as SearchFiltersType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const ActiveBounties = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
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

  const loadBounties = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;

      let processedFilters = { ...filters };
      if (filters.deadline) {
        const now = new Date();
        switch (filters.deadline) {
          case 'week':
            processedFilters.deadlineBefore = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            processedFilters.deadlineBefore = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
        }
        delete processedFilters.deadline;
      }

      const response = await supabaseApi.getBounties(currentPage, 20, processedFilters);
      
      if (reset) {
        setBounties(response.data);
        setPage(2);
      } else {
        setBounties(prev => [...prev, ...response.data]);
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

  useEffect(() => {
    loadBounties(true);
  }, [filters]);

  const handleFiltersChange = (newFilters: SearchFiltersType) => {
    setFilters(newFilters);
    
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
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Active Bounties
          </h1>
          <p className="text-lg text-muted-foreground">
            Browse all bounties and find what people are looking for
          </p>
        </div>
      </section>

      {/* Bounties with Filters */}
      <section className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="relative max-w-md w-full">
              <Input
                placeholder="Search bounties..."
                value={filters.keyword || ''}
                onChange={(e) => handleFiltersChange({ ...filters, keyword: e.target.value })}
                className="pl-10 h-12 text-base"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              {filters.keyword && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => handleFiltersChange({ ...filters, keyword: undefined })}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <SearchFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
            />
          </div>

          <BountyGrid 
            bounties={bounties}
            loading={loading && page === 1}
            emptyMessage="No bounties match your criteria"
            emptyDescription="Try adjusting your filters or check back later for new bounties."
          />

          {hasMore && bounties.length > 0 && (
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
