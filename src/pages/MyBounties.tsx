import { useState, useEffect, useCallback } from 'react';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, MessageCircle, Sparkles, Package, Users, CheckCircle, DollarSign, Truck, Bookmark, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bounty, Claim, BountyStatus, ClaimStatus } from '@/lib/types';
import { supabaseApi } from '@/lib/api/supabase';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { BountyCard } from '@/components/bounty/BountyCard';
import { useSavedBounties } from '@/hooks/use-saved-bounties';
import { ProofImages } from '@/components/bounty/ProofImages';

interface PendingReview {
  bountyId: string;
  bountyTitle: string;
  userToRateId: string;
  userToRateName: string;
  ratingType: 'poster_to_hunter' | 'hunter_to_poster';
}

export default function MyBounties() {
  const [searchParams] = useSearchParams();
  const [postedBounties, setPostedBounties] = useState<Bounty[]>([]);
  const [appliedBounties, setAppliedBounties] = useState<(Bounty & { claim: Claim })[]>([]);
  const [savedBounties, setSavedBounties] = useState<Bounty[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posted');
  const { toast } = useToast();
  const { user } = useAuth();
  const { isSaved, toggleSave, refresh: refreshSavedIds } = useSavedBounties();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'applied') {
      setActiveTab('applied');
    } else if (tab === 'saved') {
      setActiveTab('saved');
    } else if (tab === 'reviews') {
      setActiveTab('reviews');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      loadMyBounties();
    }
  }, [user]);

  const loadMyBounties = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const userBountiesData = await supabaseApi.getUserBounties(user.id);
      setPostedBounties(userBountiesData);

      // Load user's submissions (applied bounties)
      const userSubmissions = await supabaseApi.getUserSubmissions(user.id);
      setAppliedBounties(userSubmissions);

      // Load saved bounties upfront so the count shows correctly
      await loadSavedBounties();
      
      // Load pending reviews
      await loadPendingReviews(userBountiesData, userSubmissions);

    } catch (error) {
      console.error('Error loading bounties:', error);
      toast({
        title: "Error loading your bounties",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPendingReviews = async (
    postedBountiesData: Bounty[], 
    appliedData: (Bounty & { claim: Claim })[]
  ) => {
    if (!user) return;
    
    const reviews: PendingReview[] = [];
    
    try {
      // Get all ratings the user has already given
      const { data: existingRatings } = await supabase
        .from('user_ratings')
        .select('bounty_id, rated_user_id, rating_type')
        .eq('rater_id', user.id);
      
      const ratedSet = new Set(
        (existingRatings || []).map(r => `${r.bounty_id}-${r.rated_user_id}-${r.rating_type}`)
      );
      
      // Check posted bounties that are fulfilled - poster needs to rate hunter
      for (const bounty of postedBountiesData) {
        if (bounty.status === BountyStatus.FULFILLED) {
          // Find the accepted submission
          const { data: acceptedSubmission } = await supabase
            .from('Submissions')
            .select('hunter_id')
            .eq('bounty_id', bounty.id)
            .eq('status', 'accepted')
            .limit(1)
            .maybeSingle();
          
          if (acceptedSubmission) {
            const key = `${bounty.id}-${acceptedSubmission.hunter_id}-poster_to_hunter`;
            if (!ratedSet.has(key)) {
              // Get hunter name
              const { data: hunterProfile } = await supabase
                .from('profiles')
                .select('username, full_name')
                .eq('id', acceptedSubmission.hunter_id)
                .maybeSingle();
              
              reviews.push({
                bountyId: bounty.id,
                bountyTitle: bounty.title,
                userToRateId: acceptedSubmission.hunter_id,
                userToRateName: hunterProfile?.username || hunterProfile?.full_name || 'Hunter',
                ratingType: 'poster_to_hunter'
              });
            }
          }
        }
      }
      
      // Check applied bounties that are accepted - hunter needs to rate poster
      for (const item of appliedData) {
        if (item.claim.status === ClaimStatus.ACCEPTED || item.status === BountyStatus.FULFILLED) {
          const key = `${item.id}-${item.posterId}-hunter_to_poster`;
          if (!ratedSet.has(key)) {
            // Get poster name
            const { data: posterProfile } = await supabase
              .from('profiles')
              .select('username, full_name')
              .eq('id', item.posterId)
              .maybeSingle();
            
            reviews.push({
              bountyId: item.id,
              bountyTitle: item.title,
              userToRateId: item.posterId,
              userToRateName: posterProfile?.username || posterProfile?.full_name || 'Poster',
              ratingType: 'hunter_to_poster'
            });
          }
        }
      }
      
      // Sort reviews by most recent bounty first
      const allBounties = [...postedBountiesData, ...appliedData];
      reviews.sort((a, b) => {
        const bountyA = allBounties.find(bounty => bounty.id === a.bountyId);
        const bountyB = allBounties.find(bounty => bounty.id === b.bountyId);
        const dateA = bountyA?.createdAt ? new Date(bountyA.createdAt).getTime() : 0;
        const dateB = bountyB?.createdAt ? new Date(bountyB.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      setPendingReviews(reviews);
    } catch (error) {
      console.error('Error loading pending reviews:', error);
    }
  };

  // Load saved bounties when tab changes to 'saved'
  useEffect(() => {
    if (activeTab === 'saved' && user) {
      loadSavedBounties();
    }
  }, [activeTab, user]);

  const loadSavedBounties = async () => {
    if (!user) return;
    
    try {
      setSavedLoading(true);
      
      // Get saved bounty IDs
      const { data: savedData, error: savedError } = await supabase
        .from('saved_bounties')
        .select('bounty_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (savedError) throw savedError;

      if (savedData.length === 0) {
        setSavedBounties([]);
        return;
      }

      // Fetch the actual bounties
      const bountyIds = savedData.map(item => item.bounty_id);
      const bounties = await supabaseApi.getBountiesByIds(bountyIds);
      setSavedBounties(bounties);

    } catch (error) {
      console.error('Error loading saved bounties:', error);
      toast({
        title: "Error loading saved bounties",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSavedLoading(false);
    }
  };

  const getStatusBadge = (status: BountyStatus) => {
    switch (status) {
      case BountyStatus.OPEN:
        return <Badge className="bg-green-500 text-white hover:bg-green-600">Open</Badge>;
      case BountyStatus.CLAIMED:
        return <Badge className="status-pending">Claimed</Badge>;
      case BountyStatus.FULFILLED:
        return <Badge className="status-completed">Fulfilled</Badge>;
      case BountyStatus.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      case BountyStatus.EXPIRED:
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getClaimStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case ClaimStatus.SUBMITTED:
        return <Badge variant="secondary">Submitted</Badge>;
      case ClaimStatus.ACCEPTED:
        return <Badge className="status-active">Accepted</Badge>;
      case ClaimStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      case ClaimStatus.FULFILLED:
        return <Badge className="status-completed">Fulfilled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handlePullRefresh = useCallback(async () => {
    await loadMyBounties();
  }, [user]);

  return (
    <PullToRefresh onRefresh={handlePullRefresh}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Bounties</h1>
          <p className="text-muted-foreground">
            Manage your posted bounties and track your hunter applications
          </p>
        </div>
        
        <Button asChild className="bg-primary hover:bg-primary-hover text-primary-foreground">
          <Link to="/post">
            <Sparkles className="h-4 w-4 mr-2" />
            Post New Bounty
          </Link>
        </Button>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          setActiveTab(value);
          // Always refresh saved bounties when switching to saved tab
          if (value === 'saved') {
            loadSavedBounties();
          }
        }} 
        defaultValue="posted" 
        className="space-y-6"
      >
        <TabsList className="w-full flex overflow-x-auto scrollbar-hide">
          <TabsTrigger value="posted" className="flex-1 min-w-[60px] px-2 sm:px-3 text-xs sm:text-sm">
            Posted ({postedBounties.length})
          </TabsTrigger>
          <TabsTrigger value="applied" className="flex-1 min-w-[60px] px-2 sm:px-3 text-xs sm:text-sm">
            Applied ({appliedBounties.length})
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex-1 min-w-[70px] px-2 sm:px-3 text-xs sm:text-sm relative">
            <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="hidden sm:inline">Reviews</span>
            {pendingReviews.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 min-w-4 sm:h-5 sm:min-w-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
                {pendingReviews.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex-1 min-w-[60px] px-2 sm:px-3 text-xs sm:text-sm">
            <Bookmark className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="hidden sm:inline">Saved</span> ({savedBounties.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posted" className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-32" />
              ))}
            </div>
          ) : postedBounties.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No bounties posted yet"
              description="Start by posting your first bounty to find hard-to-locate items."
              action={
                <Button asChild className="bg-primary hover:bg-primary-hover text-primary-foreground">
                  <Link to="/post">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Post Your First Bounty
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {postedBounties.map((bounty) => (
                <Card key={bounty.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-wrap">
                            {getStatusBadge(bounty.status)}
                            <div className="bounty-amount font-semibold">
                              ${bounty.bountyAmount.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <Link 
                          to={`/b/${bounty.id}`}
                          className="block group"
                        >
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            {bounty.title}
                          </h3>
                        </Link>

                        <p className="text-muted-foreground line-clamp-2">
                          {bounty.description}
                        </p>

                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {bounty.viewsCount} views
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {bounty.claimsCount} claims
                          </div>
                          {bounty.deadline && (
                            <div>
                              Deadline: {format(bounty.deadline, 'MMM dd, yyyy')}
                            </div>
                          )}
                          <div>
                            Posted {formatDistanceToNow(bounty.createdAt, { addSuffix: true })}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                          <Link to={`/b/${bounty.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </Button>
                        
                        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                          <Link to={`/b/${bounty.id}?tab=claims`}>
                            <Users className="h-4 w-4 mr-2" />
                            <span className="sm:inline">Claims</span>
                          </Link>
                        </Button>
                        
                        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                          <Link to="/messages">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            <span className="sm:inline">Messages</span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applied" className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-40" />
              ))}
            </div>
          ) : appliedBounties.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No applications yet"
              description="Start hunting! Browse active bounties and submit claims to earn rewards."
              action={
                <Button asChild variant="outline">
                  <Link to="/">
                    Browse Bounties
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {appliedBounties.map((item) => (
                <Card key={`${item.id}-${item.claim.id}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Bounty Header */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            {getStatusBadge(item.status)}
                            <div className="bounty-amount font-semibold">
                              ${item.bountyAmount.toLocaleString()}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {item.claim.type === 'lead' ? 'Lead' : 'Found'}
                            </Badge>
                          </div>

                          <Link 
                            to={`/b/${item.id}`}
                            className="block group"
                          >
                            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                              {item.title}
                            </h3>
                          </Link>
                        </div>

                        <div className="flex items-center gap-2">
                          {getClaimStatusBadge(item.claim.status)}
                        </div>
                      </div>

                      {/* Claim Details */}
                      <div className={`rounded-lg p-4 ${
                        item.claim.status === ClaimStatus.ACCEPTED 
                          ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' 
                          : 'bg-muted/50'
                      }`}>
                        {/* Accepted claim success banner */}
                        {item.claim.status === ClaimStatus.ACCEPTED && (
                          <Alert className="mb-4 bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <AlertTitle className="text-green-800 dark:text-green-200">Congratulations! Your claim was accepted</AlertTitle>
                            <AlertDescription className="text-green-700 dark:text-green-300">
                              <div className="flex items-center gap-2 mt-1">
                                <DollarSign className="h-4 w-4" />
                                <span>Payout of ${(item.bountyAmount - (item.bountyAmount * 0.05 + 2)).toFixed(2)} is being processed to your Stripe Connect account.</span>
                              </div>
                              {item.requires_shipping && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Truck className="h-4 w-4" />
                                  <span>Check the bounty page for shipping details from the poster.</span>
                                </div>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-foreground">Your Claim</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(item.claim.submittedAt, { addSuffix: true })}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {item.claim.message}
                        </p>

                        {item.claim.proofUrls.length > 0 && (
                          <ProofImages urls={item.claim.proofUrls} />
                        )}
                        
                        {item.claim.status === ClaimStatus.REJECTED && item.claim.rejectionReason && (
                          <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-xs font-semibold text-destructive mb-1">Rejection Reason:</p>
                            <p className="text-sm text-destructive/90">{item.claim.rejectionReason}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/b/${item.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Bounty
                          </Link>
                        </Button>
                        
                        <Button asChild variant="outline" size="sm">
                          <Link to="/messages">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message Poster
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-24" />
              ))}
            </div>
          ) : pendingReviews.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No pending reviews"
              description="You're all caught up! Reviews help build trust in the community."
            />
          ) : (
            <div className="space-y-4">
              <Alert>
                <Star className="h-4 w-4" />
                <AlertTitle>Leave reviews for better community trust</AlertTitle>
                <AlertDescription>
                  Rating other users helps build a trustworthy marketplace and improves your own reputation.
                </AlertDescription>
              </Alert>
              
              {pendingReviews.map((review) => (
                <Card key={`${review.bountyId}-${review.userToRateId}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {review.ratingType === 'poster_to_hunter' ? 'Rate Hunter' : 'Rate Poster'}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-foreground">
                          Rate {review.userToRateName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          For bounty: "{review.bountyTitle}"
                        </p>
                      </div>
                      
                      <Button asChild className="bg-primary hover:bg-primary-hover text-primary-foreground">
                        <Link to={`/b/${review.bountyId}?review=true`}>
                          <Star className="h-4 w-4 mr-2" />
                          Leave Review
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          {savedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-64" />
              ))}
            </div>
          ) : savedBounties.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No saved bounties"
              description="Browse bounties and click the bookmark icon to save them for later."
              action={
                <Button asChild variant="outline">
                  <Link to="/">
                    Browse Bounties
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedBounties.map((bounty) => (
                <BountyCard 
                  key={bounty.id} 
                  bounty={bounty}
                  isSaved={isSaved(bounty.id)}
                  onToggleSave={() => {
                    toggleSave(bounty.id);
                    // Refresh the list when unsaving
                    setTimeout(() => {
                      loadSavedBounties();
                      refreshSavedIds();
                    }, 500);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}