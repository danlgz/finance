import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'USD')
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a date string or Date object consistently
 * @param date - Date string or Date object to format
 * @param format - Predefined format string ('short', 'medium', 'long', 'full', 'numeric', 'month', 'monthYear')
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @param options - Intl.DateTimeFormatOptions to customize the format (overrides format parameter)
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | null | undefined,
  format?: 'short' | 'medium' | 'long' | 'full' | 'numeric' | 'month' | 'monthYear',
  locale = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Handle invalid dates
  if (isNaN(dateObj.getTime())) return '';
  
  // Predefined formats
  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    medium: { year: 'numeric', month: 'long', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
    full: { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long', 
      hour: '2-digit', 
      minute: '2-digit' 
    },
    numeric: { year: 'numeric', month: '2-digit', day: '2-digit' },
    month: { month: 'long' },
    monthYear: { year: 'numeric', month: 'long' }
  };
  
  // Use custom options if provided, otherwise use predefined format, or default to 'short'
  const dateOptions = options || (format ? formatOptions[format] : formatOptions.short);
  
  return new Intl.DateTimeFormat(locale, dateOptions).format(dateObj);
}
