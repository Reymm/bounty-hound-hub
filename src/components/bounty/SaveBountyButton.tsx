import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SaveBountyButtonProps {
  isSaved: boolean;
  onToggle: () => void;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  className?: string;
}

export function SaveBountyButton({ isSaved, onToggle, size = 'icon', className }: SaveBountyButtonProps) {
  return (
    <Button
      variant="ghost"
      size={size}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
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
