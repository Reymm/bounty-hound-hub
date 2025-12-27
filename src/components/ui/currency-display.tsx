import { useCurrency } from '@/hooks/use-currency';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CurrencyDisplayProps {
  amount: number;
  showConversion?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CurrencyDisplay({ 
  amount, 
  showConversion = true, 
  className = '',
  size = 'md'
}: CurrencyDisplayProps) {
  const { userCurrency, formatCurrency, formatLocalOnly } = useCurrency();
  
  const usdFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  // If user is in USD or conversion disabled, just show USD
  if (!showConversion || userCurrency === 'USD') {
    return <span className={className}>{usdFormatted}</span>;
  }

  const localAmount = formatLocalOnly(amount);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`${className} cursor-help`}>
            {usdFormatted}{' '}
            <span className="text-muted-foreground text-sm">
              ({localAmount})
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Approximate conversion based on current exchange rates.
            <br />
            All transactions are processed in USD.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact version for cards
export function CurrencyDisplayCompact({ 
  amount, 
  className = '' 
}: { 
  amount: number; 
  className?: string;
}) {
  const { userCurrency, formatLocalOnly } = useCurrency();
  
  const usdFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  if (userCurrency === 'USD') {
    return <span className={className}>{usdFormatted}</span>;
  }

  return (
    <span className={className}>
      {usdFormatted}
      <span className="block text-xs text-muted-foreground mt-0.5">
        {formatLocalOnly(amount)}
      </span>
    </span>
  );
}
