import { useState } from 'react';
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

export function ShareBountyButton({ 
  bountyId, 
  title, 
  amount, 
  variant = 'outline',
  size = 'default',
  className 
}: ShareBountyButtonProps) {
  const [copied, setCopied] = useState(false);
  
  // Use custom domain for social sharing - auth.bountybay.co is the Supabase custom domain
  // This provides clean URLs and proper metadata for social crawlers
  const metaUrl = `https://auth.bountybay.co/functions/v1/bounty-meta?id=${bountyId}`;
  const directUrl = `https://bountybay.co/b/${bountyId}`;
  
  // Social share text - lead with dollar amount for attention
  const shareText = `$${amount.toLocaleString()} Bounty: "${title}" - Find this on BountyBay`;
  const encodedMetaUrl = encodeURIComponent(metaUrl);
  
  const encodedText = encodeURIComponent(shareText);
  const encodedDirectUrl = encodeURIComponent(directUrl);

  // Detect mobile for app-specific URL schemes
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const shareLinks = {
    twitter: isMobile
      ? `twitter://post?message=${encodedText}%20${encodedDirectUrl}`
      : `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedMetaUrl}`,
    reddit: `https://reddit.com/submit?url=${encodedMetaUrl}&title=${encodeURIComponent(`$${amount.toLocaleString()} Bounty: ${title}`)}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedMetaUrl}&description=${encodedText}`,
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
          await navigator.share({
            title: `$${amount.toLocaleString()} Bounty: ${title}`,
            text: shareText,
            url: directUrl,
          });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }
  };

  // Facebook: Use m.facebook.com on mobile to prevent redirect loop to desktop
  // The www subdomain triggers a "share_channel" redirect that breaks the app flow
  // The m subdomain stays within the mobile app's native dialog
  const handleFacebookShare = () => {
    if (isMobile) {
      // Mobile: Use m.facebook.com to prevent redirect loop
      window.location.href = `https://m.facebook.com/sharer/sharer.php?u=${encodedMetaUrl}&quote=${encodedText}`;
    } else {
      // Desktop: Use www with popup
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodedMetaUrl}&quote=${encodedText}`,
        '_blank',
        'width=600,height=400,menubar=no,toolbar=no'
      );
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(directUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const supportsNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const openShareLink = (url: string) => {
    if (isMobile) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'width=600,height=400,menubar=no,toolbar=no');
    }
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
        {supportsNativeShare && (
          <>
            <DropdownMenuItem onClick={handleNativeShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share via...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem onClick={handleFacebookShare}>
          <Facebook className="h-4 w-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => openShareLink(shareLinks.twitter)}>
          <Twitter className="h-4 w-4 mr-2" />
          Twitter / X
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => openShareLink(shareLinks.reddit)}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Reddit
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => openShareLink(shareLinks.pinterest)}>
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
          </svg>
          Pinterest
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
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
