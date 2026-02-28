const SUPABASE_STORAGE_URL = 'https://lenyuvobgktgdearflim.supabase.co/storage/v1/object/public/';
const SUPABASE_RENDER_URL = 'https://lenyuvobgktgdearflim.supabase.co/storage/v1/render/image/public/';

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain' | 'fill';
}

/**
 * Returns an optimized image URL using Supabase Storage image transformations.
 * Only transforms Supabase storage URLs; returns other URLs unchanged.
 * 
 * Note: Requires Supabase Pro plan for image transformations.
 * Falls back gracefully to the original URL if transformations aren't available.
 */
export function getOptimizedImageUrl(
  url: string,
  options: ImageTransformOptions = {}
): string {
  if (!url) return url;

  // Only transform Supabase storage public URLs
  if (!url.startsWith(SUPABASE_STORAGE_URL)) {
    return url;
  }

  const { width, height, quality = 75, resize = 'cover' } = options;

  // Replace /object/public/ with /render/image/public/ for transformation endpoint
  const renderUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );

  const params = new URLSearchParams();
  if (width) params.set('width', String(width));
  if (height) params.set('height', String(height));
  params.set('quality', String(quality));
  params.set('resize', resize);

  return `${renderUrl}?${params.toString()}`;
}

/** Preset for card thumbnails (~400px wide) */
export function getThumbnailUrl(url: string): string {
  return getOptimizedImageUrl(url, { width: 400, quality: 70, resize: 'cover' });
}

/** Preset for compact card thumbnails (~200px wide) */
export function getSmallThumbnailUrl(url: string): string {
  return getOptimizedImageUrl(url, { width: 200, quality: 65, resize: 'cover' });
}

/** Preset for full-size detail view */
export function getFullSizeUrl(url: string): string {
  return getOptimizedImageUrl(url, { width: 1200, quality: 85, resize: 'contain' });
}
