import { Lock } from 'lucide-react';

export function StripeBadge({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-muted-foreground ${className}`}>
      <Lock className="h-3 w-3" />
      <span className="text-xs">Payments secured by</span>
      <span
        className="text-sm font-semibold tracking-tight text-foreground lowercase"
        aria-label="Stripe"
      >
        stripe
      </span>
    </div>
  );
}
