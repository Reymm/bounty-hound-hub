import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string;
  showFallbackIcon?: boolean;
}

/**
 * Image component with built-in error handling and fallback display.
 * Shows a placeholder when images fail to load.
 */
export function SafeImage({
  src,
  alt,
  className,
  fallbackClassName,
  showFallbackIcon = true,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    console.warn('[SafeImage] Failed to load image:', src);
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError || !src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          fallbackClassName || className
        )}
        role="img"
        aria-label={alt || "Image unavailable"}
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
        {...props}
      />
    </>
  );
}
