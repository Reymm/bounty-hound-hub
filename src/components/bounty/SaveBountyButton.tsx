import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';

interface SaveBountyButtonProps {
  isSaved: boolean;
  onToggle: () => void;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  className?: string;
}

export function SaveBountyButton({ isSaved, onToggle, size = 'icon', className }: SaveBountyButtonProps) {
  // Wrap handler in try-catch to prevent native app crashes
  const handleClick = useCallback((e: React.MouseEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      onToggle();
    } catch (error) {
      // Silently catch to prevent crash in native environment
      try {
        console.error('[SaveBountyButton] onClick error:', error);
      } catch {
        // Ignore logging errors
      }
    }
  }, [onToggle]);

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      className={cn(
        "transition-colors",
        isSaved 
          ? "text-primary hover:text-primary/80" 
          : "text-muted-foreground hover:text-foreground",
        className
      )}
      title={isSaved ? "Remove from saved" : "Save bounty"}
    >
      <Bookmark 
        className={cn(
          "h-4 w-4",
          isSaved && "fill-current"
        )} 
      />
    </Button>
  );
}
