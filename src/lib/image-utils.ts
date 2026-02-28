/**
 * Image utility functions.
 * 
 * Currently returns original URLs as-is.
 * Supabase Storage image transformations require a Pro plan.
 * When upgrading, uncomment the transform logic below.
 */

/** Returns the URL unchanged (no-op until Supabase Pro plan is active) */
export function getOptimizedImageUrl(url: string): string {
  return url || '';
}

/** Preset for card thumbnails */
export function getThumbnailUrl(url: string): string {
  return url || '';
}

/** Preset for compact card thumbnails */
export function getSmallThumbnailUrl(url: string): string {
  return url || '';
}

/** Preset for full-size detail view */
export function getFullSizeUrl(url: string): string {
  return url || '';
}
