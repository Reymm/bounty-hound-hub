import { useState, useMemo } from 'react';
import { Share2, Facebook, Twitter, Link2, Check, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ShareBountyButtonProps {
  bountyId: string;
  title: string;
  amount: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/** Simple mobile check — touch device with narrow viewport */
function getIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth <= 768 &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );
}

export function ShareBountyButton({ 
  bountyId, 
  title, 
  amount, 
  variant = 'outline',
  size = 'default',
  className 
}: ShareBountyButtonProps) {
  const [copied, setCopied] = useState(false);
  
  const isMobile = useMemo(() => getIsMobile(), []);
  const supportsNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  // metaUrl = edge function that serves OG tags for crawlers, then redirects users to the real page
  const metaUrl = `https://auth.bountybay.co/functions/v1/bounty-meta/${bountyId}`;
  
  const shareText = `$${amount.toLocaleString()} Bounty: ${title}`;
  const encodedMetaUrl = encodeURIComponent(metaUrl);
  const encodedText = encodeURIComponent(shareText);

  // Desktop-only: social platform share links (web-based popups)
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedMetaUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedMetaUrl}&quote=${encodedText}`,
    reddit: `https://reddit.com/submit?url=${encodedMetaUrl}&title=${encodeURIComponent(`$${amount.toLocaleString()} Bounty: ${title}`)}`,
  };

  // Native share — hands URL to OS share sheet which opens real apps
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `$${amount.toLocaleString()} Bounty: ${title}`,
          text: shareText,
          url: metaUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }
  };

  const handleCopyLink = async () => {
    if (!bountyId) {
      toast.error('Unable to copy link - bounty ID missing');
      return;
    }
    try {
      await navigator.clipboard.writeText(metaUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error('Failed to copy link');
    }
  };

  const openShareLink = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400,menubar=no,toolbar=no');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="h-4 w-4" />
          {size !== 'icon' && <span className="ml-2">Share</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* MOBILE: Native Share first (opens OS share sheet → real apps) */}
        {isMobile && supportsNativeShare && (
          <>
            <DropdownMenuItem onClick={handleNativeShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share via...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Platform buttons — on mobile they trigger native share, on desktop they open web popups */}
        <DropdownMenuItem onClick={() => isMobile && supportsNativeShare ? handleNativeShare() : openShareLink(shareLinks.facebook)}>
          <Facebook className="h-4 w-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => isMobile && supportsNativeShare ? handleNativeShare() : openShareLink(shareLinks.twitter)}>
          <Twitter className="h-4 w-4 mr-2" />
          Twitter / X
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => isMobile && supportsNativeShare ? handleNativeShare() : openShareLink(shareLinks.reddit)}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Reddit
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Copy Link — always available */}
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Link2 className="h-4 w-4 mr-2" />
          )}
          {copied ? 'Copied!' : 'Copy Link'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
