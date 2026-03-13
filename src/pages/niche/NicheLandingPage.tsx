import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BountyGrid } from '@/components/bounty/BountyGrid';
import { supabaseApi } from '@/lib/api/supabase';
import { Bounty, BountyCategory, SearchFilters } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface NicheConfig {
  slug: string;
  category: BountyCategory;
  categories?: BountyCategory[];
  subcategories?: string[];
  title: string;
  subtitle: string;
  description: string;
  heroGradient: string;
  icon: React.ReactNode;
  trustBadgeText: string;
  ctaText: string;
  emptyMessage: string;
  emptyDescription: string;
  ogImage?: string;
  features: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }[];
}

interface NicheLandingPageProps {
  config: NicheConfig;
}

export function NicheLandingPage({ config }: NicheLandingPageProps) {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const filters: SearchFilters = {
    ...(config.categories ? { categories: config.categories } : { category: config.category }),
    ...(config.subcategories && { subcategories: config.subcategories }),
  };

  const loadBounties = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const response = await supabaseApi.getBounties(currentPage, 12, filters);
      
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
  }, [config.category]);

  const pageTitle = `${config.title} | BountyBay`;
  const pageUrl = `https://bountybay.co/${config.slug}`;
  const ogImage = config.ogImage || 'https://bountybay.co/og-default.png';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={config.description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={config.description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="BountyBay" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={config.description} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

      {/* Hero — compact */}
      <section className={`${config.heroGradient} border-b border-border`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
              {config.title}
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              {config.subtitle}
            </p>
            
            <Button asChild size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground w-full sm:w-auto">
              <Link to={user ? `/post?category=${config.category}` : "/auth"}>
                <Sparkles className="h-5 w-5 mr-2" />
                {config.ctaText}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Bounties */}
      <section className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BountyGrid 
            bounties={bounties}
            loading={loading && page === 1}
            emptyMessage={config.emptyMessage}
            emptyDescription={config.emptyDescription}
          />

          {hasMore && bounties.length > 0 && (
            <div className="mt-8 text-center">
              <Button 
                onClick={() => loadBounties(false)}
                disabled={loading}
                variant="outline"
                size="lg"
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Simple 3-step strip */}
      <section className="py-8 border-t border-border bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2 text-sm font-bold">1</div>
              <p className="text-sm font-medium text-foreground">Post a bounty</p>
            </div>
            <div>
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2 text-sm font-bold">2</div>
              <p className="text-sm font-medium text-foreground">Hunters find it</p>
            </div>
            <div>
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2 text-sm font-bold">3</div>
              <p className="text-sm font-medium text-foreground">Pay only if found</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
