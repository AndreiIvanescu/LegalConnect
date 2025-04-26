// Currency utility functions
interface CurrencyConfig {
  symbol: string;
  name: string;
  code: string;
  exchangeRate: number; // Relative to RON
  decimalPlaces: number;
}

// Currency configurations
export const CURRENCIES: Record<string, CurrencyConfig> = {
  'RO': {
    symbol: 'RON',
    name: 'Romanian Leu',
    code: 'RON',
    exchangeRate: 1,
    decimalPlaces: 2
  },
  'DE': {
    symbol: '€',
    name: 'Euro',
    code: 'EUR',
    exchangeRate: 0.20, // 1 RON = 0.20 EUR (example rate)
    decimalPlaces: 2
  },
  'US': {
    symbol: '$',
    name: 'US Dollar',
    code: 'USD',
    exchangeRate: 0.22, // 1 RON = 0.22 USD (example rate)
    decimalPlaces: 2
  }
};

// Default to RON if country is not supported
const DEFAULT_CURRENCY = CURRENCIES['RO'];

/**
 * Gets currency configuration based on country code
 */
export function getCurrencyForCountry(countryCode: string): CurrencyConfig {
  return CURRENCIES[countryCode] || DEFAULT_CURRENCY;
}

/**
 * Format price from RON cents to display value in appropriate currency
 */
export function formatPrice(
  priceInRonCents: number | undefined | null,
  countryCode: string = 'RO'
): string {
  if (priceInRonCents === undefined || priceInRonCents === null) {
    return 'N/A';
  }

  const currency = getCurrencyForCountry(countryCode);
  
  // Convert from RON cents to RON units
  const priceInRon = priceInRonCents / 100;
  
  // Convert to target currency
  const priceInTargetCurrency = priceInRon * currency.exchangeRate;
  
  // Format the price
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.decimalPlaces,
  }).format(priceInTargetCurrency);
}

/**
 * Parses user-entered price to RON cents
 * Accepts either RON units (e.g., 150) or already in cents (15000)
 */
export function parsePrice(
  input: string | number,
  countryCode: string = 'RO',
  isInCents: boolean = false
): number | null {
  const currency = getCurrencyForCountry(countryCode);
  const numericValue = typeof input === 'string' ? parseFloat(input) : input;
  
  if (isNaN(numericValue)) {
    return null;
  }

  if (isInCents) {
    return numericValue;
  }
  
  // Convert from target currency to RON
  const valueInRon = numericValue / currency.exchangeRate;
  
  // Convert to RON cents (for now we still store in cents in DB)
  return Math.round(valueInRon * 100);
}

/**
 * Get user's country code from browser or fallback to RO
 */
export function getUserCountry(): string {
  // Try to get language with region code (e.g., en-US)
  const lang = navigator.language;
  const parts = lang.split('-');
  
  if (parts.length > 1) {
    return parts[1];
  }
  
  // Fallback to Romanian
  return 'RO';
}

/**
 * Gets the currency symbol for the user's country
 */
export function getUserCurrencySymbol(): string {
  const country = getUserCountry();
  const currency = getCurrencyForCountry(country);
  return currency.symbol;
}