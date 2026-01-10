import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CurrencyDisplayProps {
  amount: number;
  showUSD?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CurrencyDisplay({ 
  amount, 
  showUSD = true, 
  className = '',
  size = 'md'
}: CurrencyDisplayProps) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  if (!showUSD) {
    return <span className={className}>{formatted}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`${className} cursor-help`}>
            {formatted}{' '}
            <span className="text-muted-foreground text-xs font-normal">
              USD
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            All transactions are processed in USD.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact version for cards - shows USD label
export function CurrencyDisplayCompact({ 
  amount, 
  className = '',
  showLabel = true
}: { 
  amount: number; 
  className?: string;
  showLabel?: boolean;
}) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <span className={className}>
      {formatted}
      {showLabel && (
        <span className="text-xs text-muted-foreground ml-1">USD</span>
      )}
    </span>
  );
}

// Simple inline format for tables/lists where we don't need label on every row
export function formatUSD(amount: number, includeCents = false): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: includeCents ? 2 : 0,
    maximumFractionDigits: includeCents ? 2 : 0,
  }).format(amount);
}
