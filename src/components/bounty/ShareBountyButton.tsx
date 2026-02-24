import { useState } from 'react';
import { Share2, Link2, Check, MessageSquare } from 'lucide-react';
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
  
  const supportsNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  // Clean URL for display/copy — looks professional in chat apps
  const cleanUrl = `https://bountybay.co/b/${bountyId}`;
  // Edge function URL for native share — serves OG tags for iMessage crawlers
  const metaUrl = `https://auth.bountybay.co/functions/v1/bounty-meta/${bountyId}`;

  // Native share — hands URL to OS share sheet which opens real apps (uses edge function for OG)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
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
      await navigator.clipboard.writeText(cleanUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error('Failed to copy link');
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
        {/* Native Share — opens OS share sheet (works on mobile & some desktops) */}
        {supportsNativeShare && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share via...
          </DropdownMenuItem>
        )}

        {supportsNativeShare && <DropdownMenuSeparator />}
        
        {/* Copy Link — always available */}
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Link2 className="h-4 w-4 mr-2" />
          )}
          {copied ? 'Copied!' : 'Copy Link'}
        </DropdownMenuItem>

        {/* Send via Text — opens SMS app with pre-filled message */}
        <DropdownMenuItem asChild>
          <a href={`sms:?&body=${encodeURIComponent(cleanUrl)}`}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Send via Text
          </a>
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}
