/**
 * Currency formatting and detection utilities
 * Handles robust price parsing, validation, and formatting
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
 * @param priceStr Price string like "₱1,500", "$50", "€100"
 * @returns Currency code or null if not detected
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
 * Parses a price string to a number, handling various formats
 * @param priceStr Price string like "₱1,500.00" or "1500" or "1,500.00"
 * @returns Parsed number or 0 if invalid
 */
export function parsePrice(priceStr: string): number {
  if (!priceStr || typeof priceStr !== 'string') return 0;
  
  // Remove all non-digit and non-decimal characters
  const cleanedPrice = priceStr.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleanedPrice);
  
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/**
 * Validates if a price string is a valid price
 * @param priceStr Price string to validate
 * @returns Object with isValid boolean and optional error message
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
  
  const price = parsePrice(trimmed);
  
  if (isNaN(price) || price <= 0) {
    return { isValid: false, error: 'Price must be a valid number greater than 0' };
  }
  
  if (options?.min !== undefined && price < options.min) {
    return { 
      isValid: false, 
      error: `Price must be at least ${formatPrice(options.min)}` 
    };
  }
  
  if (options?.max !== undefined && price > options.max) {
    return { 
      isValid: false, 
      error: `Price cannot exceed ${formatPrice(options.max)}` 
    };
  }
  
  return { isValid: true };
}

/**
 * Formats a price for display
 * @param price Number to format
 * @param currency Currency code (default: PHP)
 * @param options Formatting options
 * @returns Formatted price string like "₱1,500.00"
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
  const numPrice = typeof price === 'string' ? parsePrice(price) : price;
  
  if (isNaN(numPrice)) return '₱0.00';
  
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
 * Normalizes a price input string
 * Adds currency symbol if missing and validates format
 * @param priceStr Raw input from user
 * @returns Normalized price string or error
 */
export function normalizePrice(
  priceStr: string,
  currency: string = DEFAULT_CURRENCY
): { value: string; error?: string } {
  const trimmed = (priceStr || '').trim();
  
  if (!trimmed) {
    return { value: '', error: 'Price is required' };
  }
  
  const validation = validatePrice(trimmed);
  if (!validation.isValid) {
    return { value: trimmed, error: validation.error };
  }
  
  const parsed = parsePrice(trimmed);
  const formatted = formatPrice(parsed, currency);
  
  return { value: formatted };
}

/**
 * Calculates total from a list of prices
 * @param prices Array of price strings or numbers
 * @returns Total as a number
 */
export function calculateTotal(prices: (string | number)[]): number {
  return prices.reduce<number>((total, price) => {
    const parsed = typeof price === 'string' ? parsePrice(price) : price;
    return total + parsed;
  }, 0);
}

/**
 * Applies discount to a price
 * @param price Original price
 * @param discountPercent Discount percentage (0-100)
 * @returns Discounted price as a number
 */
export function applyDiscount(price: number | string, discountPercent: number): number {
  const numPrice = typeof price === 'string' ? parsePrice(price) : price;
  const validDiscount = Math.max(0, Math.min(100, discountPercent));
  return numPrice * (1 - validDiscount / 100);
}
