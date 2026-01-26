import { useState, useEffect } from 'react';
import { ExternalLink, Loader2, Lock, Eye, Link2 } from 'lucide-react';
import { resolveStorageUrl } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface ProofImagesProps {
  urls: string[];
  /** If true, hide actual URLs/images and show a locked placeholder */
  isHidden?: boolean;
  /** Message to show when content is hidden */
  hiddenMessage?: string;
}

interface ResolvedUrl {
  original: string;
  resolved: string;
  isImage: boolean;
}

/**
 * Check if URL is an image - either by extension, storage reference, or Supabase storage URL
 */
const isImageUrl = (url: string): boolean => {
  // Check file extension
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) return true;
  // Check if it's a storage reference (our new format)
  if (url.startsWith('supabase-storage://')) return true;
  // Check if it's a Supabase storage URL (likely an image upload)
  if (url.includes('supabase.co/storage/v1/object')) return true;
  return false;
};

export function ProofImages({ urls, isHidden = false, hiddenMessage }: ProofImagesProps) {
  const [resolvedUrls, setResolvedUrls] = useState<ResolvedUrl[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If hidden, don't bother resolving URLs - just count them
    if (isHidden) {
      setLoading(false);
      return;
    }

    const resolveUrls = async () => {
      if (!urls || urls.length === 0) {
        setResolvedUrls([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      const resolved = await Promise.all(
        urls.map(async (url) => {
          const isImage = isImageUrl(url);
          
          // Only resolve storage references and expired Supabase URLs
          if (url.startsWith('supabase-storage://') || 
              url.includes('supabase.co/storage/v1/object/sign/')) {
            const resolvedUrl = await resolveStorageUrl(url);
            return {
              original: url,
              resolved: resolvedUrl || url,
              isImage
            };
          }
          
          return {
            original: url,
            resolved: url,
            isImage
          };
        })
      );
      
      setResolvedUrls(resolved);
      setLoading(false);
    };

    resolveUrls();
  }, [urls, isHidden]);

  if (loading && !isHidden) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading proof...
      </div>
    );
  }

  if (!urls || urls.length === 0) {
    return null;
  }

  // Count images vs links for hidden display
  const imageCount = urls.filter(isImageUrl).length;
  const linkCount = urls.length - imageCount;

  // If hidden, show a locked placeholder instead of actual content
  if (isHidden) {
    return (
      <div className="space-y-3">
        <div className="border border-dashed rounded-lg p-4 bg-muted/30">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="p-2 rounded-full bg-muted">
              <Lock className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Proof Hidden Until Acceptance
              </p>
              <p className="text-xs mt-1">
                {hiddenMessage || 'Accept this claim to reveal the proof URLs and images.'}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs">
                {imageCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {imageCount} image{imageCount !== 1 ? 's' : ''}
                  </span>
                )}
                {linkCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    {linkCount} link{linkCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const imageUrls = resolvedUrls.filter(u => u.isImage);
  const otherUrls = resolvedUrls.filter(u => !u.isImage);

  return (
    <div className="space-y-3">
      {/* Display images */}
      {imageUrls.length > 0 && (
        <div>
          <p className="text-xs font-medium text-foreground mb-2">Proof Images:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {imageUrls.map((urlData, index) => (
              <a
                key={index}
                href={urlData.resolved}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg border hover:opacity-90 transition-opacity"
              >
                <img
                  src={urlData.resolved}
                  alt={`Proof ${index + 1}`}
                  className="w-full h-48 sm:h-56 object-cover cursor-pointer"
                  onError={(e) => {
                    // Safe DOM manipulation - avoid innerHTML to prevent XSS
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const span = document.createElement('span');
                      span.className = 'flex items-center justify-center gap-2 text-sm text-primary p-4';
                      span.textContent = '📎 View file';
                      parent.replaceChild(span, e.currentTarget);
                    }
                  }}
                />
              </a>
            ))}
          </div>
        </div>
      )}
      
      {/* Display other URLs */}
      {otherUrls.length > 0 && (
        <div>
          <p className="text-xs font-medium text-foreground mb-2">Proof URLs:</p>
          <div className="space-y-1">
            {otherUrls.map((urlData, index) => (
              <a
                key={index}
                href={urlData.resolved}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {urlData.original.length > 50 ? `${urlData.original.substring(0, 50)}...` : urlData.original}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
