import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams, Link } from 'react-router-dom';
import { Trophy, ShieldCheck, CreditCard, HelpCircle, Sparkles, Share2 } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { Button } from '@/components/ui/button';
import { BountyGrid } from '@/components/bounty/BountyGrid';
import { SearchFilters } from '@/components/filters/SearchFilters';

import { CompletedBounties } from '@/components/home/CompletedBounties';
import { HowItWorksPreview } from '@/components/home/HowItWorksPreview';
import { supabaseApi } from '@/lib/api/supabase';
import { Bounty, SearchFilters as SearchFiltersType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';


const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortByTop, setSortByTop] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();


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
      const response = await supabaseApi.getBounties(currentPage, 20, filters);
      
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


  // Check if any filters are active
  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <>
      <Helmet>
        <title>BountyBay - Find The Unfindable</title>
      </Helmet>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-success/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Post a bounty. Get it found.
            </h1>
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              Describe what you're looking for, set a reward, and let verified hunters 
              compete to find it. You only pay when they succeed.
            </p>
            
            {/* Trust Badges */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center items-center mb-4">
              <div className="inline-flex items-center justify-center gap-2 bg-success/10 border border-success/20 rounded-full px-3 py-1.5 sm:px-4 sm:py-2">
                <ShieldCheck className="h-4 w-4 text-success flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-success">
                  ID-verified hunters
                </span>
              </div>
              <div className="inline-flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 sm:px-4 sm:py-2">
                <CreditCard className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-primary">
                  Only pay when found
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-8 text-center">
              By using BountyBay, you agree to our{' '}
              <Link to="/legal/terms" className="underline hover:text-foreground">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/legal/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
            </p>
            <div className="flex flex-col gap-4 items-center">
              {/* Primary CTA */}
              <Button asChild size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground w-full sm:w-auto min-h-[44px]">
                <Link to={user ? "/post" : "/setup"}>
                  {user && <Sparkles className="h-5 w-5 mr-2" />}
                  {user ? "Post a Bounty" : "Sign Up Free"}
                </Link>
              </Button>
              
              {/* Secondary text links */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
                {!user && (
                  <span className="text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/auth?tab=signin" className="text-primary hover:underline font-medium">
                      Sign In
                    </Link>
                  </span>
                )}
                <Link 
                  to="/how-it-works" 
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <HelpCircle className="h-4 w-4" />
                  How It Works
                </Link>
                <button
                  onClick={async () => {
                    const shareData = {
                      title: 'BountyBay - Find The Unfindable',
                      text: 'Post a bounty for hard-to-find items and let hunters find them for you!',
                      url: 'https://bountybay.co',
                    };
                    if (navigator.share) {
                      try { await navigator.share(shareData); } catch (e) { if ((e as Error).name !== 'AbortError') console.error(e); }
                    } else {
                      await navigator.clipboard.writeText('https://bountybay.co');
                      sonnerToast.success('Link copied to clipboard!');
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <Share2 className="h-4 w-4" />
                  Share BountyBay
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Preview - Only on homepage default view */}
      {!hasActiveFilters && <HowItWorksPreview />}

      {/* Browse Section - Active Bounties First */}
      <section id="browse" className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              {sortByTop && (
                <Trophy className="h-6 w-6 text-warning" />
              )}
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  {sortByTop ? 'Top Bounties' : 'Active Bounties'}
                </h2>
                <p className="text-primary">
                  {sortByTop 
                    ? 'Highest paying bounties - biggest rewards first'
                    : 'Discover what people are looking for and start earning'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSortByTop(!sortByTop);
                  setFilters(prev => ({ 
                    ...prev, 
                    sortBy: !sortByTop ? 'top' : 'newest' 
                  }));
                }}
                className={`ml-2 ${sortByTop ? "text-warning hover:text-warning/80" : "text-muted-foreground"}`}
              >
                <Trophy className="h-4 w-4 mr-1" />
                {sortByTop ? 'Show All' : 'Top $'}
              </Button>
            </div>
            
            <SearchFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
            />
          </div>

          <BountyGrid 
            bounties={hasActiveFilters ? bounties : bounties.slice(0, 12)}
            loading={loading && page === 1}
            emptyMessage="No bounties match your criteria"
            emptyDescription="Try adjusting your filters or check back later for new bounties."
          />

          {/* View All / Load More */}
          {hasActiveFilters ? (
            // When filtering, show load more pagination
            hasMore && bounties.length > 0 && (
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
            )
          ) : (
            // On homepage default view, show "View All" button
            bounties.length > 12 && (
              <div className="mt-8 text-center">
                <Button 
                  asChild
                  variant="outline"
                  size="lg"
                >
                  <Link to="/bounties">View All Bounties →</Link>
                </Button>
              </div>
            )
          )}
        </div>
      </section>

      {/* Success Stories Section - Hidden when filters active */}
      {!hasActiveFilters && (
        <CompletedBounties />
      )}
    </>
  );
};

export default Index;
