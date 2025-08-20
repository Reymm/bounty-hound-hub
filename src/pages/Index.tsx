import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BountyGrid } from '@/components/bounty/BountyGrid';
import { SearchFilters } from '@/components/filters/SearchFilters';
import { mockApi } from '@/lib/api/mock';
import { Bounty, SearchFilters as SearchFiltersType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters: SearchFiltersType = {};
    const keyword = searchParams.get('search');
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    
    if (keyword) urlFilters.keyword = keyword;
    if (category) urlFilters.category = category as any;
    if (location) urlFilters.location = location;
    
    setFilters(urlFilters);
  }, [searchParams]);

  // Load bounties
  const loadBounties = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const response = await mockApi.getBounties(currentPage, 20, filters);
      
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

  // Load bounties when filters change
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

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, keyword: query }));
  };

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-success/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Find anything with the power of
              <span className="text-primary block">crowdsourced hunting</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Post a bounty for hard-to-find items and let our community of hunters 
              help you discover exactly what you're looking for.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground">
                <Link to="/post">
                  <Plus className="h-5 w-5 mr-2" />
                  Post Your First Bounty
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="#browse">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Browse Active Bounties
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Browse Section */}
      <section id="browse" className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                Active Bounties
              </h2>
              <p className="text-muted-foreground">
                Discover what people are looking for and start earning
              </p>
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

          {/* Load More */}
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
    </>
  );
};

export default Index;
