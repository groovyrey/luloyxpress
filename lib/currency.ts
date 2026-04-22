/**
 * Currency formatting and detection utilities
 * Simplified: Using standard JavaScript numbers instead of decimal.js
 */

export const CURRENCY_SYMBOLS = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
} as const;

export const DEFAULT_CURRENCY = 'PHP';

/**
 * Detects currency type from a price string
 */
export function detectCurrency(priceStr: string): string | null {
  if (!priceStr) return null;
  const trimmed = priceStr.trim();
  if (trimmed.startsWith('₱')) return 'PHP';
  if (trimmed.startsWith('$')) return 'USD';
  if (trimmed.startsWith('€')) return 'EUR';
  if (trimmed.startsWith('£')) return 'GBP';
  if (trimmed.startsWith('¥')) return 'JPY';
  return null;
}

/**
 * Cleans a price string by removing non-numeric characters (except decimal point)
 */
export function cleanPriceString(priceStr: string): string {
  if (!priceStr || typeof priceStr !== 'string') return '0';
  return priceStr.replace(/[^\d.]/g, '') || '0';
}

/**
 * Parses a price string or number to a standard JS number
 */
export function parsePriceToDecimal(price: string | number): number {
  if (typeof price === 'number') return price;
  const cleanedPrice = cleanPriceString(price);
  const parsed = parseFloat(cleanedPrice);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validates if a price string is a valid price
 */
export function validatePrice(
  priceStr: string,
  options?: { min?: number; max?: number }
): { isValid: boolean; error?: string } {
  if (!priceStr || typeof priceStr !== 'string') {
    return { isValid: false, error: 'Price is required' };
  }
  const trimmed = priceStr.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Price is required' };
  }
  
  const price = parsePriceToDecimal(trimmed);
  
  if (isNaN(price) || price <= 0) {
    return { isValid: false, error: 'Price must be a valid number greater than 0' };
  }
  
  if (options?.min !== undefined && price < options.min) {
    return { isValid: false, error: `Price must be at least ${formatPrice(options.min)}` };
  }
  
  if (options?.max !== undefined && price > options.max) {
    return { isValid: false, error: `Price cannot exceed ${formatPrice(options.max)}` };
  }
  
  return { isValid: true };
}

/**
 * Formats a price for display
 */
export function formatPrice(
  price: number | string,
  currency: string = DEFAULT_CURRENCY,
  options?: {
    showSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const numPrice = parsePriceToDecimal(price);
  
  const minFractionDigits = options?.minimumFractionDigits ?? 2;
  const maxFractionDigits = options?.maximumFractionDigits ?? 2;
  
  const formatted = numPrice.toLocaleString('en-PH', {
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  });
  
  const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || '₱';
  if (options?.showSymbol === false) {
    return formatted;
  }
  return `${symbol}${formatted}`;
}

/**
 * Calculates total from a list of prices
 */
export function calculateTotal(items: (string | number)[]): string {
  const total = items.reduce<number>((acc, item) => {
    return acc + parsePriceToDecimal(item);
  }, 0);
  return total.toFixed(2);
}

/**
 * Applies discount to a price
 */
export function applyDiscount(price: number | string, discountPercent: number): string {
  const numPrice = parsePriceToDecimal(price);
  const validDiscount = Math.max(0, Math.min(100, discountPercent));
  const discounted = numPrice * (1 - validDiscount / 100);
  return discounted.toFixed(2);
}
