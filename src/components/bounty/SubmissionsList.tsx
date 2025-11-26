import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ShippingDetailsDialog } from './ShippingDetailsDialog';
import { RequestRevisionDialog } from './RequestRevisionDialog';
import { OpenDisputeDialog } from './OpenDisputeDialog';
import { TrackingDialog } from './TrackingDialog';
import { supabaseApi } from '@/lib/api/supabase';
import { Claim, ClaimStatus } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, ExternalLink, FileText, AlertTriangle, RefreshCw, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubmissionsListProps {
  bountyId: string;
  bountyTitle?: string;
  posterId: string;
  currentUserId?: string;
  requiresShipping?: boolean;
  onRefresh?: () => void;
}

export function SubmissionsList({ bountyId, bountyTitle, posterId, currentUserId, requiresShipping = false, onRefresh }: SubmissionsListProps) {
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
  const { toast } = useToast();

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
    const success = await supabaseApi.updateClaimStatus(submissionId, ClaimStatus.ACCEPTED);
    if (success) {
      // Find the accepted claim to get hunter info
      const claim = submissions.find(s => s.id === submissionId);
      if (claim) {
        setAcceptedClaim(claim);
        // Only show shipping dialog if bounty requires shipping
        if (requiresShipping) {
          setShippingDialogOpen(true);
        }
      }
      
      // Process payout to hunter
      try {
        const payoutResult = await supabaseApi.processPayout(submissionId);
        if (payoutResult.success) {
          toast({
            title: "Claim accepted & payout sent",
            description: `Payment of $${payoutResult.amount?.toFixed(2)} sent to hunter (2.3% platform fee: $${payoutResult.platform_fee?.toFixed(2)})`,
          });
        } else {
          toast({
            title: "Claim accepted",
            description: "Claim accepted but payout processing pending. Hunter will receive payment shortly.",
          });
        }
      } catch (payoutError) {
        console.error('Payout error:', payoutError);
        toast({
          title: "Claim accepted",
          description: "Claim accepted successfully. Payout will be processed automatically.",
        });
      }
      
      await loadSubmissions();
      onRefresh?.();
    } else {
      toast({
        title: "Error",
        description: "Failed to accept the claim. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectClaim = async () => {
    if (!selectedSubmission) return;
    
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
    } else {
      toast({
        title: "Error",
        description: "Failed to reject the claim. Please try again.",
        variant: "destructive",
      });
    }
  };

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
                    <p className="text-sm text-muted-foreground">
                      ⭐ {submission.hunterRating.toFixed(1)} rating
                    </p>
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
                <div>
                  <p className="text-xs font-medium text-foreground mb-2">Proof URLs:</p>
                  <div className="space-y-1">
                    {submission.proofUrls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {url.length > 50 ? `${url.substring(0, 50)}...` : url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                <span>
                  Submitted {formatDistanceToNow(submission.submittedAt, { addSuffix: true })}
                </span>
                
                <div className="flex items-center gap-2">
                  {isOwner && submission.status === ClaimStatus.SUBMITTED && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleAcceptClaim(submission.id)}
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
                        Request Revision
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
                  <Button size="sm" variant="outline" disabled>
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
              disabled={!rejectionReason.trim()}
            >
              Reject Submission
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
          }}
          onShippingDetailsProvided={() => {
            setShippingDialogOpen(false);
            setAcceptedClaim(null);
            onRefresh?.();
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
    </div>
  );
}