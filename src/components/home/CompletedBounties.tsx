import { useState, useEffect } from 'react';
import { CheckCircle, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  useEffect(() => {
    loadCompletedBounties();
  }, []);

  const loadCompletedBounties = async () => {
    try {
      // Get fulfilled bounties with accepted submissions
      const { data: bounties, error } = await supabase
        .from('Bounties')
        .select(`
          id,
          title,
          amount,
          category,
          images,
          updated_at,
          poster_id
        `)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      if (bounties && bounties.length > 0) {
        // Get submission and profile data
        const enrichedBounties = await Promise.all(
          bounties.map(async (bounty) => {
            // Get accepted submission for this bounty
            const { data: submission } = await supabase
              .from('Submissions')
              .select('hunter_id, updated_at')
              .eq('bounty_id', bounty.id)
              .eq('status', 'accepted')
              .single();

            if (!submission) return null;

            // Get hunter profile
            const { data: hunterProfile } = await supabase
              .from('profiles')
              .select('username, full_name')
              .eq('id', submission.hunter_id)
              .single();

            // Get poster profile
            const { data: posterProfile } = await supabase
              .from('profiles')
              .select('username, full_name')
              .eq('id', bounty.poster_id)
              .single();

            return {
              id: bounty.id,
              title: bounty.title,
              amount: bounty.amount || 0,
              category: bounty.category || 'Other',
              completed_at: submission.updated_at,
              hunter_name: hunterProfile?.username || hunterProfile?.full_name || 'Anonymous',
              poster_name: posterProfile?.username || posterProfile?.full_name || 'Anonymous',
              images: bounty.images || [],
            };
          })
        );

        setCompletedBounties(enrichedBounties.filter((b): b is CompletedBounty => b !== null));
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
            Real bounties found and paid out by our community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedBounties.map((bounty) => (
            <Link key={bounty.id} to={`/b/${bounty.id}`}>
              <Card className="group hover:border-success/50 transition-all duration-300 hover:shadow-lg overflow-hidden h-full">
                <CardContent className="p-0">
                  {/* Image */}
                  {bounty.images.length > 0 ? (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={bounty.images[0]}
                        alt={bounty.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <Badge className="absolute top-3 right-3 bg-success text-success-foreground border-0">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  ) : (
                    <div className="relative h-48 bg-gradient-to-br from-success/10 to-success/5 flex items-center justify-center">
                      <CheckCircle className="h-12 w-12 text-success/30" />
                      <Badge className="absolute top-3 right-3 bg-success text-success-foreground border-0">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {bounty.title}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {bounty.category}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/10">
                          <DollarSign className="h-4 w-4 text-success" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-success">
                            ${bounty.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Paid Out</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(bounty.completed_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Found by <span className="font-medium text-foreground">{bounty.hunter_name}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            <TrendingUp className="inline h-4 w-4 mr-1 text-success" />
            Join our hunters and start earning today
          </p>
        </div>
      </div>
    </section>
  );
}
