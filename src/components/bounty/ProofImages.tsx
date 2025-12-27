import { useState, useEffect } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { resolveStorageUrl } from '@/lib/storage';

interface ProofImagesProps {
  urls: string[];
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

export function ProofImages({ urls }: ProofImagesProps) {
  const [resolvedUrls, setResolvedUrls] = useState<ResolvedUrl[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [urls]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading proof...
      </div>
    );
  }

  if (resolvedUrls.length === 0) {
    return null;
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
                    console.error('Image failed to load:', urlData.resolved);
                    // Show as link fallback instead of hiding
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="flex items-center justify-center gap-2 text-sm text-primary p-4">📎 View file</span>`;
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