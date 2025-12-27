import { useState, useEffect } from 'react';

// Common exchange rates (updated periodically via API, fallback values here)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  CAD: 1.36,
  EUR: 0.92,
  GBP: 0.79,
  AUD: 1.53,
  JPY: 149.50,
  MXN: 17.15,
  INR: 83.12,
  BRL: 4.97,
  CHF: 0.88,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  CAD: 'C$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  JPY: '¥',
  MXN: 'MX$',
  INR: '₹',
  BRL: 'R$',
  CHF: 'CHF',
};

const LOCALE_TO_CURRENCY: Record<string, string> = {
  'en-US': 'USD',
  'en-CA': 'CAD',
  'fr-CA': 'CAD',
  'en-GB': 'GBP',
  'en-AU': 'AUD',
  'de-DE': 'EUR',
  'fr-FR': 'EUR',
  'es-ES': 'EUR',
  'it-IT': 'EUR',
  'ja-JP': 'JPY',
  'es-MX': 'MXN',
  'hi-IN': 'INR',
  'pt-BR': 'BRL',
  'de-CH': 'CHF',
  'fr-CH': 'CHF',
};

interface CurrencyState {
  userCurrency: string;
  rates: Record<string, number>;
  isLoading: boolean;
}

const RATES_CACHE_KEY = 'bountybay_exchange_rates';
const RATES_CACHE_EXPIRY = 1000 * 60 * 60 * 6; // 6 hours

function detectUserCurrency(): string {
  try {
    const locale = navigator.language || 'en-US';
    
    // Try exact match first
    if (LOCALE_TO_CURRENCY[locale]) {
      return LOCALE_TO_CURRENCY[locale];
    }
    
    // Try language code only
    const langCode = locale.split('-')[0];
    const matchingLocale = Object.keys(LOCALE_TO_CURRENCY).find(
      key => key.startsWith(langCode + '-')
    );
    
    if (matchingLocale) {
      return LOCALE_TO_CURRENCY[matchingLocale];
    }
    
    return 'USD';
  } catch {
    return 'USD';
  }
}

function getCachedRates(): { rates: Record<string, number>; expired: boolean } | null {
  try {
    const cached = localStorage.getItem(RATES_CACHE_KEY);
    if (!cached) return null;
    
    const { rates, timestamp } = JSON.parse(cached);
    const expired = Date.now() - timestamp > RATES_CACHE_EXPIRY;
    
    return { rates, expired };
  } catch {
    return null;
  }
}

function setCachedRates(rates: Record<string, number>) {
  try {
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({
      rates,
      timestamp: Date.now(),
    }));
  } catch {
    // Ignore storage errors
  }
}

export function useCurrency() {
  const [state, setState] = useState<CurrencyState>({
    userCurrency: 'USD',
    rates: FALLBACK_RATES,
    isLoading: true,
  });

  useEffect(() => {
    const userCurrency = detectUserCurrency();
    
    // Check cache first
    const cached = getCachedRates();
    if (cached && !cached.expired) {
      setState({
        userCurrency,
        rates: cached.rates,
        isLoading: false,
      });
      return;
    }
    
    // Use fallback rates if cache exists but expired, still try to refresh
    if (cached) {
      setState({
        userCurrency,
        rates: cached.rates,
        isLoading: false,
      });
    }
    
    // Fetch fresh rates (using a free API)
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data.rates) {
          const rates = {
            USD: 1,
            CAD: data.rates.CAD || FALLBACK_RATES.CAD,
            EUR: data.rates.EUR || FALLBACK_RATES.EUR,
            GBP: data.rates.GBP || FALLBACK_RATES.GBP,
            AUD: data.rates.AUD || FALLBACK_RATES.AUD,
            JPY: data.rates.JPY || FALLBACK_RATES.JPY,
            MXN: data.rates.MXN || FALLBACK_RATES.MXN,
            INR: data.rates.INR || FALLBACK_RATES.INR,
            BRL: data.rates.BRL || FALLBACK_RATES.BRL,
            CHF: data.rates.CHF || FALLBACK_RATES.CHF,
          };
          setCachedRates(rates);
          setState({
            userCurrency,
            rates,
            isLoading: false,
          });
        }
      })
      .catch(() => {
        // Use fallback rates on error
        setState(prev => ({
          ...prev,
          userCurrency,
          isLoading: false,
        }));
      });
  }, []);

  const convertFromUSD = (amountUSD: number, toCurrency?: string): number => {
    const currency = toCurrency || state.userCurrency;
    const rate = state.rates[currency] || 1;
    return amountUSD * rate;
  };

  const formatCurrency = (amountUSD: number, showConversion = true): string => {
    const usdFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountUSD);

    if (!showConversion || state.userCurrency === 'USD') {
      return usdFormatted;
    }

    const converted = convertFromUSD(amountUSD);
    const symbol = CURRENCY_SYMBOLS[state.userCurrency] || state.userCurrency;
    const localFormatted = `~${symbol}${Math.round(converted).toLocaleString()}`;

    return `${usdFormatted} (${localFormatted})`;
  };

  const formatLocalOnly = (amountUSD: number): string => {
    if (state.userCurrency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amountUSD);
    }

    const converted = convertFromUSD(amountUSD);
    const symbol = CURRENCY_SYMBOLS[state.userCurrency] || state.userCurrency;
    return `~${symbol}${Math.round(converted).toLocaleString()}`;
  };

  return {
    userCurrency: state.userCurrency,
    rates: state.rates,
    isLoading: state.isLoading,
    convertFromUSD,
    formatCurrency,
    formatLocalOnly,
    currencySymbol: CURRENCY_SYMBOLS[state.userCurrency] || '$',
  };
}

// Simple component for inline currency display
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
