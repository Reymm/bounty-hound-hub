import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Eye, MessageCircle, Flag, ArrowLeft, Star, Users, Clock, CheckCircle, XCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { ClaimDialog } from '@/components/bounty/ClaimDialog';
import { CancelBountyDialog } from '@/components/bounty/CancelBountyDialog';
import { SubmissionsList } from '@/components/bounty/SubmissionsList';
import { ReportUserDialog } from '@/components/reports/ReportUserDialog';
import { BountyRatingSection } from '@/components/ratings/BountyRatingSection';
import { supabaseApi } from '@/lib/api/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Bounty, BountyStatus } from '@/lib/types';
import { format, formatDistanceToNow } from 'date-fns';

export default function BountyDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [refreshKey, setRefreshKey] = useState(0);
  const [totalPaid, setTotalPaid] = useState<number | undefined>(undefined);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const isOwnBounty = user?.id === bounty?.posterId;
  const canCancelBounty = isOwnBounty && bounty?.status !== BountyStatus.FULFILLED;

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'claims') {
      setActiveTab('claims');
    }
  }, [searchParams]);

  useEffect(() => {
    loadBountyDetail();
  }, [id]);

  // Realtime subscription for bounty status changes
  useEffect(() => {
    if (!id) return;
    
    const { supabase } = require('@/integrations/supabase/client');
    const channel = supabase
      .channel('bounty-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Bounties',
          filter: `id=eq.${id}`,
        },
        (payload: any) => {
          // Reload bounty when status changes
          loadBountyDetail();
          toast({
            title: "Bounty Updated",
            description: "This bounty has been updated.",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const loadBountyDetail = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const bountyData = await supabaseApi.getBounty(id);
      setBounty(bountyData);
      
      // If user owns the bounty, fetch escrow data to show correct refund amount
      if (user?.id === bountyData.posterId) {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: escrowData } = await supabase
            .from('escrow_transactions')
            .select('total_charged_amount')
            .eq('bounty_id', id)
            .single();
          
          if (escrowData?.total_charged_amount) {
            setTotalPaid(escrowData.total_charged_amount);
          }
        } catch (escrowError) {
          console.log('Could not fetch escrow data:', escrowError);
          // Not critical, will fall back to bounty amount
        }
      }
    } catch (error) {
      console.error('Error loading bounty:', error);
      toast({
        title: "Error loading bounty",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimSubmitted = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Claim submitted successfully!",
      description: "The bounty poster will review your submission.",
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSkeleton className="h-96 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <LoadingSkeleton className="h-64" />
            <LoadingSkeleton className="h-48" />
          </div>
          <LoadingSkeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Bounty not found</h1>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browse
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (bounty.status) {
      case BountyStatus.OPEN:
        return <Badge className="status-active">Active</Badge>;
      case BountyStatus.CLAIMED:
        return <Badge className="status-pending">Claimed</Badge>;
      case BountyStatus.FULFILLED:
        return <Badge className="status-completed">Fulfilled</Badge>;
      default:
        return <Badge variant="secondary">{bounty.status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Link>
        </Button>
      </div>

      {/* Header */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                {getStatusBadge()}
                <div className="bounty-amount text-xl font-bold">
                  ${bounty.bountyAmount.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  {bounty.viewsCount} views
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {bounty.claimsCount} claims
                </div>
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                {bounty.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {bounty.location}
                </div>
                {bounty.deadline && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Deadline: {format(bounty.deadline, 'MMM dd, yyyy')}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Posted {formatDistanceToNow(new Date(bounty.createdAt), { addSuffix: true })}
                </div>
              </div>

                <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-medium text-primary-foreground">
                    {bounty.posterName.charAt(0)}
                  </div>
                  <div>
                    <Link 
                      to={`/u/${bounty.posterId}`}
                      className="font-medium hover:text-primary transition-colors hover:underline"
                    >
                      {bounty.posterName}
                    </Link>
                    {bounty.posterRatingCount > 0 ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        {bounty.posterRating.toFixed(1)} ({bounty.posterRatingCount} reviews)
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No reviews yet</p>
                    )}
                  </div>
                </div>
                
                {user && user.id !== bounty.posterId && (
                  <ReportUserDialog 
                    reportedUserId={bounty.posterId}
                    reportedUserName={bounty.posterName}
                    bountyId={bounty.id}
                  />
                )}
              </div>

              {bounty.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {bounty.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              {canCancelBounty && (
                <Button
                  variant="destructive"
                  onClick={() => setIsCancelDialogOpen(true)}
                  className="mt-4"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Bounty
                </Button>
              )}
            </div>

            {/* Action Panel - Desktop */}
            <div className="hidden lg:block lg:w-80">
              <Card>
                <CardContent className="p-4 space-y-4">
                  {bounty.targetPriceMin && bounty.targetPriceMax && (
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Target Price Range</p>
                      <p className="font-semibold">
                        ${bounty.targetPriceMin.toLocaleString()} - ${bounty.targetPriceMax.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {!isOwnBounty && (
                    <>
                      <Button 
                        asChild 
                        className="w-full" 
                        variant="outline"
                      >
                        <Link 
                          to="/messages" 
                          state={{ 
                            recipientId: bounty.posterId,
                            bountyId: bounty.id,
                            bountyTitle: bounty.title
                          }}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Send Message
                        </Link>
                      </Button>

                      <Button
                        className="w-full bg-primary hover:bg-primary-hover"
                        onClick={() => setIsClaimDialogOpen(true)}
                        disabled={!user}
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        Claim This Bounty
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="claims">Claims</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                      {bounty.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {bounty.images && bounty.images.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {bounty.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Bounty image ${index + 1}`}
                          className="rounded-lg object-cover w-full h-32 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedImageIndex(index)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No images uploaded</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="requirements">
              <Card>
                <CardHeader>
                  <CardTitle>Verification Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  {bounty.verificationRequirements && bounty.verificationRequirements.length > 0 ? (
                    <div className="space-y-3">
                      {bounty.verificationRequirements.map((requirement, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="text-foreground">{requirement}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No verification requirements specified</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="claims">
              <div className="space-y-6">
                <SubmissionsList 
                  key={refreshKey}
                  bountyId={bounty.id}
                  bountyTitle={bounty.title}
                  posterId={bounty.posterId}
                  currentUserId={user?.id}
                  requiresShipping={bounty.requires_shipping}
                  onRefresh={() => setRefreshKey(prev => prev + 1)}
                />
                
                {/* Rating Section - Show after bounty completion */}
                <BountyRatingSection
                  bountyId={bounty.id}
                  posterId={bounty.posterId}
                  posterName={bounty.posterName}
                  bountyStatus={bounty.status}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Mobile Action Panel */}
        <div className="lg:hidden">
          <Card className="sticky top-20">
            <CardContent className="p-4 space-y-4">
              {bounty.targetPriceMin && bounty.targetPriceMax && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Target Price Range</p>
                  <p className="font-semibold">
                    ${bounty.targetPriceMin.toLocaleString()} - ${bounty.targetPriceMax.toLocaleString()}
                  </p>
                </div>
              )}

              {!isOwnBounty && (
                <>
                  <Button 
                    asChild 
                    className="w-full" 
                    variant="outline"
                  >
                    <Link 
                      to="/messages" 
                      state={{ 
                        recipientId: bounty.posterId,
                        bountyId: bounty.id,
                        bountyTitle: bounty.title
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Message
                    </Link>
                  </Button>

                  <Button
                    className="w-full bg-primary hover:bg-primary-hover"
                    onClick={() => setIsClaimDialogOpen(true)}
                    disabled={!user}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Claim This Bounty
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Claim Dialog */}
      <ClaimDialog
        bountyId={bounty.id}
        bountyTitle={bounty.title}
        bountyAmount={bounty.bountyAmount}
        isOpen={isClaimDialogOpen}
        onClose={() => setIsClaimDialogOpen(false)}
        onClaimSubmitted={handleClaimSubmitted}
      />

      {/* Cancel Bounty Dialog */}
      {bounty && (
        <CancelBountyDialog
          bountyId={bounty.id}
          bountyAmount={bounty.bountyAmount}
          bountyCreatedAt={bounty.createdAt.toISOString()}
          open={isCancelDialogOpen}
          onOpenChange={setIsCancelDialogOpen}
          totalPaid={totalPaid}
        />
      )}

      {/* Image Lightbox Dialog */}
      <Dialog open={selectedImageIndex !== null} onOpenChange={() => setSelectedImageIndex(null)}>
        <DialogContent className="max-w-5xl w-full p-0 overflow-hidden bg-black/95">
          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          
          {selectedImageIndex !== null && bounty?.images && (
            <div className="relative flex items-center justify-center min-h-[60vh] max-h-[90vh]">
              {/* Previous Button */}
              {bounty.images.length > 1 && selectedImageIndex > 0 && (
                <button
                  onClick={() => setSelectedImageIndex(selectedImageIndex - 1)}
                  className="absolute left-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
              )}
              
              {/* Image */}
              <img
                src={bounty.images[selectedImageIndex]}
                alt={`Bounty image ${selectedImageIndex + 1}`}
                className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
              />
              
              {/* Next Button */}
              {bounty.images.length > 1 && selectedImageIndex < bounty.images.length - 1 && (
                <button
                  onClick={() => setSelectedImageIndex(selectedImageIndex + 1)}
                  className="absolute right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              )}
              
              {/* Image Counter */}
              {bounty.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm">
                  {selectedImageIndex + 1} / {bounty.images.length}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}