import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Gift, Copy, Users, Check, DollarSign, Share2, Crown, TrendingUp } from 'lucide-react';

interface ReferralStats {
  referralCode: string;
  totalReferred: number;
  pendingRewards: number;
  earnedCredits: number;
  isPartner: boolean;
  partnerName: string | null;
  partnerCommissionPercent: number | null;
  partnerFlatFeeCents: number | null;
}

export function ReferralCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      loadReferralStats();
    }
  }, [user]);

  const loadReferralStats = async () => {
    if (!user) return;
    
    try {
      // Get user's referral code, credits, and partner info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('referral_code, referral_credits, is_partner, partner_name, partner_commission_percent, partner_flat_fee_cents')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Count referrals
      const { count: referralCount } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', user.id);

      // Count pending rewards (signed_up but not rewarded)
      const { count: pendingCount } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', user.id)
        .in('status', ['signed_up', 'completed']);

      setStats({
        referralCode: profile?.referral_code || '',
        totalReferred: referralCount || 0,
        pendingRewards: pendingCount || 0,
        earnedCredits: Number(profile?.referral_credits) || 0,
        isPartner: profile?.is_partner || false,
        partnerName: profile?.partner_name || null,
        partnerCommissionPercent: profile?.partner_commission_percent ? Number(profile.partner_commission_percent) : null,
        partnerFlatFeeCents: profile?.partner_flat_fee_cents || null,
      });
    } catch (error) {
      console.error('Error loading referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (!stats?.referralCode) return;
    
    const referralLink = `${window.location.origin}/auth?ref=${stats.referralCode}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with friends to earn rewards.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please copy the link manually.",
      });
    }
  };

  const shareReferral = async () => {
    if (!stats?.referralCode) return;
    
    const referralLink = `${window.location.origin}/auth?ref=${stats.referralCode}`;
    const shareData = {
      title: 'Join BountyBay!',
      text: 'Find hard-to-find items or earn money by hunting bounties. Join using my referral link!',
      url: referralLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled or share failed - fall back to copy
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate partner earnings example (on a $100 bounty)
  const calculatePartnerEarnings = () => {
    if (!stats?.isPartner) return null;
    const exampleBounty = 100;
    const platformPercent = 0.05; // 5%
    const platformFlat = 2; // $2
    
    const percentEarning = stats.partnerCommissionPercent 
      ? exampleBounty * platformPercent * stats.partnerCommissionPercent 
      : 0;
    const flatEarning = stats.partnerFlatFeeCents 
      ? stats.partnerFlatFeeCents / 100 
      : 0;
    
    return {
      percentEarning,
      flatEarning,
      total: percentEarning + flatEarning,
      percentRate: stats.partnerCommissionPercent ? (stats.partnerCommissionPercent * 100) : 0,
      flatRate: flatEarning,
    };
  };

  const partnerEarnings = calculatePartnerEarnings();

  return (
    <Card className={stats?.isPartner ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-transparent' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {stats?.isPartner ? (
            <>
              <Crown className="h-5 w-5 text-primary" />
              Partner Dashboard
            </>
          ) : (
            <>
              <Gift className="h-5 w-5 text-primary" />
              Refer Friends & Earn
            </>
          )}
        </CardTitle>
        <CardDescription>
          {stats?.isPartner && stats.partnerName ? (
            <span className="flex items-center gap-2">
              <Badge variant="secondary" className="font-medium">
                {stats.partnerName}
              </Badge>
            </span>
          ) : (
            "Invite friends to BountyBay. When they complete their first bounty, you both earn rewards!"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Partner Commission Info */}
        {stats?.isPartner && partnerEarnings && (
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Your Commission Rates</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">% of platform fee</p>
                <p className="font-bold text-lg">{partnerEarnings.percentRate.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Flat fee per bounty</p>
                <p className="font-bold text-lg">${partnerEarnings.flatRate.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-primary/20">
              <p className="text-xs text-muted-foreground">Example: On a $100 bounty you'd earn</p>
              <p className="font-bold text-primary text-lg">${partnerEarnings.total.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-muted rounded-lg">
            <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats?.totalReferred || 0}</p>
            <p className="text-xs text-muted-foreground">Referred</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <Gift className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats?.pendingRewards || 0}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-primary">${stats?.earnedCredits?.toFixed(0) || 0}</p>
            <p className="text-xs text-muted-foreground">Earned</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Referral Link</label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={stats?.referralCode ? `${window.location.origin}/auth?ref=${stats.referralCode}` : ''}
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyReferralLink}
              className="shrink-0"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Share Button */}
        <Button onClick={shareReferral} className="w-full">
          <Share2 className="h-4 w-4 mr-2" />
          Share Referral Link
        </Button>

        {/* Referral Code Badge */}
        <div className="text-center pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Your referral code</p>
          <Badge variant="secondary" className="text-lg font-mono px-4 py-1">
            {stats?.referralCode || 'Loading...'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
