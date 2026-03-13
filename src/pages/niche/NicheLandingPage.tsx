import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Sparkles, TrendingUp, ShieldCheck, Heart, Search, Users } from 'lucide-react';
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
  const pageUrl = `https://bountybay.lovable.app/${config.slug}`;
  const ogImage = config.ogImage || 'https://bountybay.lovable.app/og-default.png';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={config.description} />
        <link rel="canonical" href={pageUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={config.description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="BountyBay" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pageUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={config.description} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

      {/* Hero Section */}
      <section className={`${config.heroGradient} border-b border-border`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center max-w-3xl mx-auto">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-background border border-border shadow-lg">
                {config.icon}
              </div>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {config.title}
            </h1>
            <h2 className="text-xl lg:text-2xl font-semibold text-primary mb-6">
              {config.subtitle}
            </h2>
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              {config.description}
            </p>
            
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-success/10 border border-success/20 rounded-full px-4 py-2 mb-8">
              <ShieldCheck className="h-5 w-5 text-success" />
              <span className="text-sm font-medium text-success">
                {config.trustBadgeText}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground w-full sm:w-auto">
                <Link to={user ? `/post?category=${config.category}` : "/auth"}>
                  <Sparkles className="h-5 w-5 mr-2" />
                  {config.ctaText}
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link to="/bounties">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Browse All Bounties
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {config.features.map((feature, index) => (
              <div key={index} className="text-center p-6 bg-background rounded-xl border border-border">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Bounties Section */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
              Browse Active Bounties
            </h2>
            <p className="text-muted-foreground">
              Help someone find what they are looking for and earn a reward
            </p>
          </div>

          <BountyGrid 
            bounties={bounties}
            loading={loading && page === 1}
            emptyMessage={config.emptyMessage}
            emptyDescription={config.emptyDescription}
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

      {/* How It Works Section */}
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
              How BountyBay Works
            </h2>
            <p className="text-muted-foreground">
              Safe, simple, and secure
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold text-foreground mb-2">Post a Bounty</h3>
              <p className="text-sm text-muted-foreground">
                Describe what you're looking for and set a reward amount
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold text-foreground mb-2">Hunters Search</h3>
              <p className="text-sm text-muted-foreground">
                Our verified community helps locate what you need
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold text-foreground mb-2">Safe Transaction</h3>
              <p className="text-sm text-muted-foreground">
                Card saved securely — only charged when you accept a claim
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of people using BountyBay to find what they're looking for.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground">
            <Link to={user ? `/post?category=${config.category}` : "/auth"}>
              <Sparkles className="h-5 w-5 mr-2" />
              {config.ctaText}
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
