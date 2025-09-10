import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
}

export function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false,
  size = 'md',
  showCount = false,
  count 
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={cn(
              "focus:outline-none transition-colors",
              !readonly && "hover:scale-110 cursor-pointer",
              readonly && "cursor-default"
            )}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors",
                star <= displayRating
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-300"
              )}
            />
          </button>
        ))}
      </div>
      
      {showCount && count !== undefined && (
        <span className="text-sm text-muted-foreground ml-1">
          ({count})
        </span>
      )}
      
      {!showCount && !readonly && (
        <span className="text-sm text-muted-foreground ml-1">
          {displayRating}/5
        </span>
      )}
    </div>
  );
}