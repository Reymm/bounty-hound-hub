import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string;
  showFallbackIcon?: boolean;
}

/**
 * Image component with built-in error handling and fallback display.
 * Shows a placeholder when images fail to load.
 * Safe for native Capacitor environments - all handlers are wrapped in try-catch.
 */
export function SafeImage({
  src,
  alt,
  className,
  fallbackClassName,
  showFallbackIcon = true,
  onClick,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = useCallback(() => {
    try {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[SafeImage] Failed to load image:', src);
      }
    } catch {
      // Silently ignore logging errors in native environments
    }
    setHasError(true);
    setIsLoading(false);
  }, [src]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Wrap onClick to prevent crashes in native environments
  const handleClick = useCallback((e: React.MouseEvent<HTMLImageElement | HTMLDivElement>) => {
    if (!onClick) return;
    try {
      e.preventDefault();
      e.stopPropagation();
      onClick(e as React.MouseEvent<HTMLImageElement>);
    } catch (error) {
      // Silently catch to prevent native app crash
      try {
        console.error('[SafeImage] onClick error:', error);
      } catch {
        // Ignore
      }
    }
  }, [onClick]);

  if (hasError || !src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          fallbackClassName || className
        )}
        role="img"
        aria-label={alt || "Image unavailable"}
        onClick={onClick ? handleClick : undefined}
      >
        {showFallbackIcon && (
          <div className="flex flex-col items-center gap-2 p-4">
            <ImageOff className="h-8 w-8 opacity-50" />
            <span className="text-xs text-center opacity-70">Image unavailable</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div
          className={cn(
            "animate-pulse bg-muted",
            className
          )}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(className, isLoading && "hidden")}
        onError={handleError}
        onLoad={handleLoad}
        onClick={onClick ? handleClick : undefined}
        {...props}
      />
    </>
  );
}
