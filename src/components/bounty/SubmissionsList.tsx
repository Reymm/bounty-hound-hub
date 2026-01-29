import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ShippingDetailsDialog } from './ShippingDetailsDialog';
import { RequestRevisionDialog } from './RequestRevisionDialog';
import { OpenDisputeDialog } from './OpenDisputeDialog';
import { TrackingDialog } from './TrackingDialog';
import { RatingPromptDialog } from '@/components/ratings/RatingPromptDialog';
import { ProofImages } from './ProofImages';
import { supabaseApi } from '@/lib/api/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Claim, ClaimStatus } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, FileText, AlertTriangle, RefreshCw, Package, Trash2, DollarSign, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SubmissionsListProps {
  bountyId: string;
  bountyTitle?: string;
  posterId: string;
  currentUserId?: string;
  requiresShipping?: boolean;
  onRefresh?: () => void;
  onEditSubmission?: () => void;
}

export function SubmissionsList({ bountyId, bountyTitle, posterId, currentUserId, requiresShipping = false, onRefresh, onEditSubmission }: SubmissionsListProps) {
  const [submissions, setSubmissions] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [acceptedClaim, setAcceptedClaim] = useState<Claim | null>(null);
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  const [rejectingClaim, setRejectingClaim] = useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [acceptingClaim, setAcceptingClaim] = useState(false);
  const [submissionToAccept, setSubmissionToAccept] = useState<string | null>(null);
  const [ratingPromptOpen, setRatingPromptOpen] = useState(false);
  const [ratingPromptData, setRatingPromptData] = useState<{ hunterId: string; hunterName: string } | null>(null);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawingClaim, setWithdrawingClaim] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadSubmissions();
  }, [bountyId]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const claims = await supabaseApi.getClaims(bountyId);
      setSubmissions(claims);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ClaimStatus) => {
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

  const handleAcceptClaim = async (submissionId: string) => {
    setAcceptingClaim(true);
    try {
      const success = await supabaseApi.updateClaimStatus(submissionId, ClaimStatus.ACCEPTED);
    if (success) {
      // Find the accepted claim to get hunter info
      const claim = submissions.find(s => s.id === submissionId);
      if (claim) {
        setAcceptedClaim(claim);
        
        // Set up rating prompt data for after shipping dialog or immediately
        setRatingPromptData({
          hunterId: claim.hunterId,
          hunterName: claim.hunterName,
        });
        
        // Only show shipping dialog if bounty requires shipping
        // IMPORTANT: If showing shipping dialog, DON'T refresh yet - wait until dialog closes
        if (requiresShipping) {
          // Update shipping status to 'requested' so hunter knows to wait for details
          await supabase
            .from('Bounties')
            .update({ shipping_status: 'requested' })
            .eq('id', bountyId);
            
          setShippingDialogOpen(true);
          // Don't call onRefresh here - it will be called when shipping dialog closes
        }
      }
      
      // Update bounty status to fulfilled (completed)
      await supabaseApi.updateBountyStatus(bountyId, 'fulfilled' as any);
      
      // Process payout to hunter
      try {
        const payoutResult = await supabaseApi.processPayout(submissionId);
        if (payoutResult.success && payoutResult.amount !== undefined) {
          toast({
            title: "Bounty completed!",
            description: "Payment captured successfully. The hunter will receive their payout after the 7-day security hold.",
          });
        } else if (payoutResult.already_captured) {
          toast({
            title: "Payment already captured",
            description: "This payment has already been processed.",
          });
        } else if (payoutResult.dispute_blocked) {
          toast({
            title: "Payout blocked",
            description: "Cannot process payout: a dispute is open on this submission.",
            variant: "destructive",
          });
        } else if (payoutResult.payout_frozen) {
          toast({
            title: "Payout frozen",
            description: payoutResult.freeze_reason || "Payout is frozen and cannot be processed.",
            variant: "destructive",
          });
        } else if (payoutResult.capture_in_progress || payoutResult.lock_failed) {
          toast({
            title: "Processing in progress",
            description: "Payment capture is already in progress. Please wait.",
            variant: "destructive",
          });
        } else if (payoutResult.requires_verification) {
          toast({
            title: "Hunter verification required",
            description: "The hunter must complete identity verification before receiving payout. They will be notified.",
            variant: "destructive",
          });
        } else if (payoutResult.success) {
          toast({
            title: "Bounty completed!",
            description: `Payment processed successfully. Hunter will receive their payout after the 7-day security hold.`,
          });
        } else {
          toast({
            title: "Claim accepted",
            description: payoutResult.error || "Payment is being processed.",
            variant: payoutResult.error ? "destructive" : "default",
          });
        }
      } catch (payoutError) {
        console.error('Payout error:', payoutError);
        toast({
          title: "Claim accepted",
          description: "There was an issue processing the payout. Please contact support if needed.",
          variant: "destructive",
        });
      }
      
      // Only refresh immediately if NOT showing shipping dialog
      // If shipping dialog is open, refresh will happen when it closes
      if (!requiresShipping) {
        await loadSubmissions();
        onRefresh?.();
        
        // Show rating prompt after a short delay
        if (claim) {
          setTimeout(() => {
            setRatingPromptOpen(true);
          }, 500);
        }
      }
    } else {
      toast({
        title: "Error",
        description: "Failed to accept the claim. Please try again.",
        variant: "destructive",
      });
    }
    } catch (error) {
      console.error('Error accepting claim:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAcceptingClaim(false);
    }
  };

  const handleRejectClaim = async () => {
    if (!selectedSubmission || rejectingClaim) return;
    
    setRejectingClaim(true);
    const success = await supabaseApi.updateClaimStatus(
      selectedSubmission, 
      ClaimStatus.REJECTED, 
      rejectionReason
    );
    
    if (success) {
      toast({
        title: "Claim rejected",
        description: "The submission has been rejected.",
      });
      await loadSubmissions();
      onRefresh?.();
      setRejectionDialogOpen(false);
      setSelectedSubmission(null);
      setRejectionReason('');
      setRejectingClaim(false);
    } else {
      toast({
        title: "Error",
        description: "Failed to reject the claim. Please try again.",
        variant: "destructive",
      });
      setRejectingClaim(false);
    }
  };

  const handleConfirmDelivery = async (submissionId: string) => {
    setConfirmingDelivery(true);
    try {
      const submission = submissions.find(s => s.id === submissionId);
      if (!submission) return;

      const { error } = await supabase
        .from('Submissions')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;

      // Notify hunter via edge function (handles email internally)
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'item_delivered',
            submissionId: submissionId,
            bountyTitle: bountyTitle,
            bountyId: bountyId
          }
        });
      } catch (emailError) {
        console.error('Failed to send delivery notification:', emailError);
        // Don't fail if email fails
      }

      toast({
        title: "Delivery confirmed",
        description: "The hunter will be notified and payment will be processed.",
      });

      await loadSubmissions();
      onRefresh?.();
    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast({
        title: "Error",
        description: "Failed to confirm delivery. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConfirmingDelivery(false);
    }
  };

  const handleWithdrawClaim = async () => {
    if (!selectedSubmission) return;
    
    try {
      setWithdrawingClaim(true);
      
      const { error } = await supabase
        .from('Submissions')
        .delete()
        .eq('id', selectedSubmission)
        .eq('hunter_id', currentUserId) // Ensure only own submission
        .eq('status', 'submitted'); // Only allow withdrawing pending claims
      
      if (error) throw error;
      
      toast({
        title: "Claim withdrawn",
        description: "Your submission has been removed.",
      });
      
      setWithdrawDialogOpen(false);
      setSelectedSubmission(null);
      await loadSubmissions();
      onRefresh?.();
    } catch (error) {
      console.error('Error withdrawing claim:', error);
      toast({
        title: "Error",
        description: "Failed to withdraw claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setWithdrawingClaim(false);
    }
  };

  // Note: With destination charges, funds are automatically transferred to hunter's Stripe Connect account
  // No manual release needed - Stripe handles this automatically

  const isOwner = currentUserId === posterId;

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Submissions</h3>
        {Array.from({ length: 2 }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No submissions yet"
        description="Be the first to claim this bounty!"
        className="py-8"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Submissions ({submissions.length})
        </h3>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {submissions.map((submission) => (
          <Card key={submission.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle className="text-base">{submission.hunterName}</CardTitle>
                    {submission.hunterRatingCount && submission.hunterRatingCount > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        ⭐ {submission.hunterRating.toFixed(1)} rating ({submission.hunterRatingCount} reviews)
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No ratings yet
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(submission.status)}
                  <Badge variant="outline" className="text-xs">
                    {submission.type === 'lead' ? 'Lead' : 'Found'}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {submission.message}
                </p>
              </div>

              {submission.proofUrls.length > 0 && (
                <ProofImages urls={submission.proofUrls} />
              )}

              <div className="flex flex-col gap-3 text-xs text-muted-foreground border-t pt-3">
                <span>
                  Submitted {formatDistanceToNow(submission.submittedAt, { addSuffix: true })}
                </span>
                
                {/* Action buttons - wrap on mobile */}
                <div className="flex flex-wrap items-center gap-2">
                  {isOwner && submission.status === ClaimStatus.SUBMITTED && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setSubmissionToAccept(submission.id);
                          setAcceptDialogOpen(true);
                        }}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedSubmission(submission.id);
                          setRevisionDialogOpen(true);
                        }}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Revise
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedSubmission(submission.id);
                          setDisputeDialogOpen(true);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Dispute
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedSubmission(submission.id);
                          setRejectionDialogOpen(true);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {/* Hunter can edit or withdraw their own pending claim */}
                  {submission.status === ClaimStatus.SUBMITTED && currentUserId === submission.hunterId && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onEditSubmission?.()}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedSubmission(submission.id);
                          setWithdrawDialogOpen(true);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Withdraw
                      </Button>
                    </>
                  )}
                  {submission.status === ClaimStatus.ACCEPTED && currentUserId === submission.hunterId && requiresShipping && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedSubmission(submission.id);
                        setTrackingDialogOpen(true);
                      }}
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Mark Shipped
                    </Button>
                  )}
                  {submission.status === 'shipped' as ClaimStatus && isOwner && requiresShipping && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleConfirmDelivery(submission.id)}
                      disabled={confirmingDelivery}
                      className="text-green-600 hover:text-green-700"
                    >
                      Confirm Delivery
                    </Button>
                  )}
                  {/* Note: With destination charges, funds are automatically transferred to hunter's Stripe Connect account */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      navigate('/messages', {
                        state: {
                          recipientId: submission.hunterId,
                          bountyId: bountyId,
                          bountyTitle: bountyTitle
                        }
                      });
                    }}
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Message
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for rejecting this submission:
            </p>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRejectionDialogOpen(false);
                setSelectedSubmission(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectClaim}
              disabled={!rejectionReason.trim() || rejectingClaim}
            >
              {rejectingClaim ? 'Rejecting...' : 'Reject Submission'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipping Details Dialog */}
      {acceptedClaim && requiresShipping && (
        <ShippingDetailsDialog
          bountyId={bountyId}
          bountyTitle={bountyTitle || 'Bounty'}
          hunterName={acceptedClaim.hunterName}
          isOpen={shippingDialogOpen}
          onClose={() => {
            setShippingDialogOpen(false);
            setAcceptedClaim(null);
            // Refresh data after dialog closes
            loadSubmissions();
            onRefresh?.();
            // Show rating prompt after shipping dialog closes
            setTimeout(() => {
              setRatingPromptOpen(true);
            }, 300);
          }}
          onShippingDetailsProvided={() => {
            setShippingDialogOpen(false);
            setAcceptedClaim(null);
            loadSubmissions();
            onRefresh?.();
            // Show rating prompt after shipping details provided
            setTimeout(() => {
              setRatingPromptOpen(true);
            }, 300);
          }}
        />
      )}

      {/* Request Revision Dialog */}
      {selectedSubmission && (
        <RequestRevisionDialog
          submissionId={selectedSubmission}
          isOpen={revisionDialogOpen}
          onClose={() => {
            setRevisionDialogOpen(false);
            setSelectedSubmission(null);
          }}
          onRevisionRequested={() => {
            loadSubmissions();
            onRefresh?.();
          }}
        />
      )}

      {/* Open Dispute Dialog */}
      {selectedSubmission && (
        <OpenDisputeDialog
          submissionId={selectedSubmission}
          bountyId={bountyId}
          isOpen={disputeDialogOpen}
          onClose={() => {
            setDisputeDialogOpen(false);
            setSelectedSubmission(null);
          }}
          onDisputeOpened={() => {
            loadSubmissions();
            onRefresh?.();
          }}
        />
      )}

      {/* Tracking Dialog */}
      {selectedSubmission && (
        <TrackingDialog
          submissionId={selectedSubmission}
          isOpen={trackingDialogOpen}
          onClose={() => {
            setTrackingDialogOpen(false);
            setSelectedSubmission(null);
          }}
          onTrackingAdded={() => {
            loadSubmissions();
            onRefresh?.();
          }}
        />
      )}

      {/* Accept Confirmation Dialog */}
      <AlertDialog open={acceptDialogOpen} onOpenChange={(open) => {
        // Prevent closing while processing
        if (!acceptingClaim) {
          setAcceptDialogOpen(open);
          if (!open) setSubmissionToAccept(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept this submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the bounty as completed and <strong>immediately charge your card</strong> to release the reward to the hunter. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={acceptingClaim}
              onClick={() => {
                setAcceptDialogOpen(false);
                setSubmissionToAccept(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={acceptingClaim}
              onClick={async () => {
                if (submissionToAccept) {
                  await handleAcceptClaim(submissionToAccept);
                }
                setAcceptDialogOpen(false);
                setSubmissionToAccept(null);
              }}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {acceptingClaim ? 'Processing...' : 'Accept & Process Payout'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Withdraw Claim Confirmation Dialog */}
      <AlertDialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Claim</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw your claim? This action cannot be undone and you will need to submit a new claim if you change your mind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={withdrawingClaim}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWithdrawClaim}
              disabled={withdrawingClaim}
              className="bg-red-600 hover:bg-red-700"
            >
              {withdrawingClaim ? 'Withdrawing...' : 'Withdraw Claim'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rating Prompt Dialog - shown after accepting a claim */}
      {ratingPromptData && (
        <RatingPromptDialog
          open={ratingPromptOpen}
          onOpenChange={setRatingPromptOpen}
          bountyId={bountyId}
          ratedUserId={ratingPromptData.hunterId}
          ratedUserName={ratingPromptData.hunterName}
          ratingType="poster_to_hunter"
          onComplete={() => {
            setRatingPromptData(null);
          }}
        />
      )}
    </div>
  );
}