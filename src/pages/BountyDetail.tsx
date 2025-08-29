import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Star, 
  Eye, 
  Users, 
  MessageCircle, 
  Flag,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Bounty, Claim, BountyStatus, ClaimType, ClaimStatus } from '@/lib/types';
import { mockApi } from '@/lib/api/mock';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';

export default function BountyDetail() {
  const { id } = useParams<{ id: string }>();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [isClaimTypeModalOpen, setIsClaimTypeModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({
    type: ClaimType.FOUND,
    message: '',
    proofUrls: [''],
  });
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBountyDetail();
  }, [id]);

  const loadBountyDetail = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setClaimsLoading(true);
      
      const [bountyData, claimsData] = await Promise.all([
        mockApi.getBounty(id),
        mockApi.getClaims(id)
      ]);
      
      setBounty(bountyData);
      setClaims(claimsData);
    } catch (error) {
      console.error('Error loading bounty:', error);
      toast({
        title: "Error loading bounty",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setClaimsLoading(false);
    }
  };

  const handleClaimTypeSelect = (claimType: ClaimType) => {
    setClaimForm(prev => ({ ...prev, type: claimType }));
    setIsClaimTypeModalOpen(false);
    setIsClaimModalOpen(true);
  };

  const handleClaimSubmit = async () => {
    if (!id || !claimForm.message.trim()) return;

    try {
      setSubmittingClaim(true);
      
      await mockApi.createClaim(id, {
        type: claimForm.type,
        message: claimForm.message,
        proofUrls: claimForm.proofUrls.filter(url => url.trim()),
        proofImages: [] // TODO: Handle file uploads
      });

      toast({
        title: "Claim submitted!",
        description: "Your claim has been sent to the bounty poster for review.",
      });

      setIsClaimModalOpen(false);
      setClaimForm({
        type: ClaimType.FOUND,
        message: '',
        proofUrls: [''],
      });

      // Reload claims
      const newClaims = await mockApi.getClaims(id);
      setClaims(newClaims);

    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        title: "Error submitting claim",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmittingClaim(false);
    }
  };

  const addProofUrl = () => {
    if (claimForm.proofUrls.length < 5) {
      setClaimForm(prev => ({
        ...prev,
        proofUrls: [...prev.proofUrls, '']
      }));
    }
  };

  const updateProofUrl = (index: number, value: string) => {
    setClaimForm(prev => ({
      ...prev,
      proofUrls: prev.proofUrls.map((url, i) => i === index ? value : url)
    }));
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
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Deadline: {format(bounty.deadline, 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Posted {formatDistanceToNow(bounty.createdAt, { addSuffix: true })}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-medium text-primary-foreground">
                    {bounty.posterName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{bounty.posterName}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      {bounty.posterRating.toFixed(1)} ({bounty.posterRatingCount} reviews)
                    </div>
                  </div>
                </div>
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
            </div>

            {/* Action Panel - Desktop */}
            <div className="lg:w-80">
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

                  <Button asChild className="w-full" variant="outline">
                    <Link to="/messages">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Message
                    </Link>
                  </Button>

                  {/* Claim Type Selection Modal */}
                  <Dialog open={isClaimTypeModalOpen} onOpenChange={setIsClaimTypeModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-primary hover:bg-primary-hover">
                        <Flag className="h-4 w-4 mr-2" />
                        Claim This Bounty
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>What kind of claim are you making?</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Button 
                          className="w-full justify-start h-auto p-4"
                          variant="outline"
                          onClick={() => handleClaimTypeSelect(ClaimType.LEAD)}
                        >
                          <div className="text-left">
                            <div className="font-medium">I Have a Lead</div>
                            <div className="text-sm text-muted-foreground">For users who know where the item might be or who might have it</div>
                          </div>
                        </Button>
                        <Button 
                          className="w-full justify-start h-auto p-4"
                          variant="outline"
                          onClick={() => handleClaimTypeSelect(ClaimType.FOUND)}
                        >
                          <div className="text-left">
                            <div className="font-medium">I Found It</div>
                            <div className="text-sm text-muted-foreground">For users who already have the item or can directly fulfill the bounty</div>
                          </div>
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Claim Form Modal */}
                  <Dialog open={isClaimModalOpen} onOpenChange={setIsClaimModalOpen}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Submit a Claim</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Claim Type</Label>
                          <Select 
                            value={claimForm.type} 
                            onValueChange={(value) => setClaimForm(prev => ({...prev, type: value as ClaimType}))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ClaimType.LEAD}>I have a lead</SelectItem>
                              <SelectItem value={ClaimType.FOUND}>I found it</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Message</Label>
                          <Textarea
                            placeholder="Describe your lead or finding..."
                            value={claimForm.message}
                            onChange={(e) => setClaimForm(prev => ({...prev, message: e.target.value}))}
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Proof URLs (Optional)</Label>
                          {claimForm.proofUrls.map((url, index) => (
                            <Input
                              key={index}
                              placeholder="https://example.com/proof"
                              value={url}
                              onChange={(e) => updateProofUrl(index, e.target.value)}
                            />
                          ))}
                          {claimForm.proofUrls.length < 5 && (
                            <Button type="button" variant="outline" size="sm" onClick={addProofUrl}>
                              Add URL
                            </Button>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setIsClaimModalOpen(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleClaimSubmit}
                            disabled={submittingClaim || !claimForm.message.trim()}
                            className="flex-1"
                          >
                            {submittingClaim ? 'Submitting...' : 'Submit Claim'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <p className="text-xs text-muted-foreground text-center">
                    💡 Identity verification required before messaging or claiming
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="claims">Claims ({claims.length})</TabsTrigger>
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

              {/* TODO: Image Gallery */}
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No images uploaded</p>
                    <p className="text-xs">TODO: Image gallery will be implemented with Supabase Storage</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requirements">
              <Card>
                <CardHeader>
                  <CardTitle>Verification Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bounty.verificationRequirements.map((requirement, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <p className="text-foreground">{requirement}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="claims">
              <Card>
                <CardHeader>
                  <CardTitle>Claims & Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  {claimsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <LoadingSkeleton key={i} className="h-24" />
                      ))}
                    </div>
                  ) : claims.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No claims submitted yet</p>
                      <p className="text-sm">Be the first to help find this item!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {claims.map((claim) => (
                        <div key={claim.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-sm font-medium">
                                {claim.hunterName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium">{claim.hunterName}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                  {claim.hunterRating.toFixed(1)}
                                  <span>•</span>
                                  <Badge variant="outline" className="text-xs">
                                    {claim.type === ClaimType.LEAD ? 'Lead' : 'Found'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {getClaimStatusBadge(claim.status)}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(claim.submittedAt, { addSuffix: true })}
                              </span>
                            </div>
                          </div>

                          <p className="text-foreground mb-3">{claim.message}</p>

                          {claim.proofUrls.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Proof URLs:</p>
                              {claim.proofUrls.map((url, index) => (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline block"
                                >
                                  {url}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
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

              <Button asChild className="w-full" variant="outline">
                <Link to="/messages">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Link>
              </Button>

              <Button 
                className="w-full bg-primary hover:bg-primary-hover"
                onClick={() => setIsClaimTypeModalOpen(true)}
              >
                <Flag className="h-4 w-4 mr-2" />
                Claim This Bounty
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                💡 Identity verification required before messaging or claiming
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}