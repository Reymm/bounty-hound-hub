import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, MessageCircle, Settings, Plus, Package, Users, CheckCircle, DollarSign, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bounty, Claim, BountyStatus, ClaimStatus, ClaimType } from '@/lib/types';
import { supabaseApi } from '@/lib/api/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';

export default function MyBounties() {
  const [searchParams] = useSearchParams();
  const [postedBounties, setPostedBounties] = useState<Bounty[]>([]);
  const [appliedBounties, setAppliedBounties] = useState<(Bounty & { claim: Claim })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posted');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'applied') {
      setActiveTab('applied');
    }
  }, [searchParams]);

  useEffect(() => {
    loadMyBounties();
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

  const getStatusBadge = (status: BountyStatus) => {
    switch (status) {
      case BountyStatus.OPEN:
        return <Badge className="status-active">Active</Badge>;
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

  return (
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
            <Plus className="h-4 w-4 mr-2" />
            Post New Bounty
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="posted" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posted">
            Posted ({postedBounties.length})
          </TabsTrigger>
          <TabsTrigger value="applied">
            Applied ({appliedBounties.length})
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
                    <Plus className="h-4 w-4 mr-2" />
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

                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/b/${bounty.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </Button>
                        
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/b/${bounty.id}?tab=claims`}>
                            <Users className="h-4 w-4 mr-2" />
                            Manage Claims
                          </Link>
                        </Button>
                        
                        <Button asChild variant="outline" size="sm">
                          <Link to="/messages">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Messages
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
                                <span>Payout of ${(item.bountyAmount * 0.977).toFixed(2)} is being processed to your Stripe Connect account.</span>
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
                          <div>
                            <p className="text-xs font-medium text-foreground mb-1">Proof URLs:</p>
                            {item.claim.proofUrls.map((url, index) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline block"
                              >
                                {url}
                              </a>
                            ))}
                          </div>
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
      </Tabs>
    </div>
  );
}