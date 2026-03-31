import { useState, useEffect, useRef } from 'react';
import { CheckCircle, DollarSign, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface CompletedBounty {
  id: string;
  title: string;
  amount: number;
  category: string;
  completed_at: string;
  hunter_name: string;
  poster_name: string;
  images: string[];
}

export function CompletedBounties() {
  const [completedBounties, setCompletedBounties] = useState<CompletedBounty[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    loadCompletedBounties();
  }, []);

  useEffect(() => {
    // Check scrollability after bounties load
    if (completedBounties.length > 0) {
      setTimeout(checkScrollability, 100);
    }
  }, [completedBounties]);

  const loadCompletedBounties = async () => {
    try {
      // Use the database function that bypasses RLS for public showcase
      const { data, error } = await supabase.rpc('get_completed_bounties_showcase', {
        limit_count: 6
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setCompletedBounties(data.map((item: any) => ({
          id: item.id,
          title: item.title,
          amount: item.amount || 0,
          category: item.category || 'Other',
          completed_at: item.completed_at,
          hunter_name: item.hunter_name,
          poster_name: item.poster_name,
          images: item.images || [],
        })));
      }
    } catch (error) {
      console.error('Error loading completed bounties:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 lg:py-16 bg-gradient-to-b from-success/5 to-background border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mb-4">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
              Recent Success Stories
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Loading...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (completedBounties.length === 0) {
    return null;
  }

  return (
    <section className="py-10 lg:py-14 bg-gradient-to-b from-success/5 to-background border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-foreground">
                Recent Success Stories
              </h2>
              <p className="text-sm text-muted-foreground">
                Real finds, real rewards. See what our hunters have tracked down.
              </p>
            </div>
          </div>
          <TrendingUp className="h-5 w-5 text-success hidden sm:block" />
        </div>

        {/* Horizontal scroll container */}
        <div className="relative -mx-4 px-4 overflow-hidden">
          <div 
            ref={scrollRef}
            onScroll={checkScrollability}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide pr-8"
          >
            {completedBounties.map((bounty) => (
              <Link 
                key={bounty.id} 
                to={`/b/${bounty.id}`}
                className="flex-shrink-0 w-72 snap-start"
              >
                <Card className="group hover:border-success/50 transition-all duration-300 hover:shadow-lg overflow-hidden h-full">
                  <CardContent className="p-0">
                    {/* Compact Image */}
                    {bounty.images.length > 0 ? (
                      <div className="relative h-40 overflow-hidden bg-muted/30">
                        <img
                          src={bounty.images[0]}
                          alt={bounty.title}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                        <Badge className="absolute top-2 right-2 bg-success text-success-foreground border-0 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Found
                        </Badge>
                      </div>
                    ) : (
                      <div className="relative h-36 bg-gradient-to-br from-success/10 to-success/5 flex items-center justify-center">
                        <CheckCircle className="h-10 w-10 text-success/30" />
                        <Badge className="absolute top-2 right-2 bg-success text-success-foreground border-0 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Found
                        </Badge>
                      </div>
                    )}

                    {/* Compact Content */}
                    <div className="p-4 space-y-3">
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                        {bounty.title}
                      </h3>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-success">
                            ${bounty.amount.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(bounty.completed_at), { addSuffix: true })}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground border-t border-border pt-2">
                        Found by <span className="font-medium text-foreground">{bounty.hunter_name}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Scroll navigation buttons */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="h-9 w-9 rounded-full border-border hover:bg-muted disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">Scroll to see more</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="h-9 w-9 rounded-full border-border hover:bg-muted disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
