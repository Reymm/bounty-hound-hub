import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div 
      className={cn(
        "animate-pulse bg-muted rounded-lg", 
        className
      )}
      role="status"
      aria-label="Loading content"
    >
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="h-5 bg-muted-foreground/20 rounded w-16"></div>
          <div className="h-6 bg-muted-foreground/20 rounded-full w-20"></div>
        </div>
        
        <div className="space-y-2">
          <div className="h-5 bg-muted-foreground/20 rounded w-3/4"></div>
          <div className="h-4 bg-muted-foreground/20 rounded w-full"></div>
          <div className="h-4 bg-muted-foreground/20 rounded w-2/3"></div>
        </div>
        
        <div className="flex gap-2">
          <div className="h-5 bg-muted-foreground/20 rounded-full w-12"></div>
          <div className="h-5 bg-muted-foreground/20 rounded-full w-16"></div>
          <div className="h-5 bg-muted-foreground/20 rounded-full w-14"></div>
        </div>
        
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 bg-muted-foreground/20 rounded w-24"></div>
          <div className="h-4 bg-muted-foreground/20 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
}