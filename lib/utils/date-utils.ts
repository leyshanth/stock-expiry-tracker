import { format, differenceInDays, isToday, parseISO } from 'date-fns';

/**
 * Format a date to a readable string
 * @param date Date to format
 * @returns Formatted date string (e.g., "Jan 1, 2025")
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM d, yyyy');
}

/**
 * Get the status of an expiry date
 * @param expiryDate Expiry date to check
 * @returns 'red' if expires today, 'yellow' if expires in 2-7 days, 'green' if more than 7 days left
 */
export function getExpiryStatus(expiryDate: Date | string): 'red' | 'yellow' | 'green' {
  const dateObj = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
  const today = new Date();
  
  // If the date is today, return red
  if (isToday(dateObj)) {
    return 'red';
  }
  
  // Calculate days until expiry
  const daysUntilExpiry = differenceInDays(dateObj, today);
  
  // If already expired or expires today, return red
  if (daysUntilExpiry <= 0) {
    return 'red';
  }
  
  // If expires in 2-7 days, return yellow
  if (daysUntilExpiry <= 7) {
    return 'yellow';
  }
  
  // If more than 7 days left, return green
  return 'green';
}

/**
 * Get the CSS class for an expiry status
 * @param status Expiry status ('red', 'yellow', or 'green')
 * @returns CSS class for the status
 */
export function getExpiryStatusClass(status: 'red' | 'yellow' | 'green'): string {
  switch (status) {
    case 'red':
      return 'bg-expiry-red text-white';
    case 'yellow':
      return 'bg-expiry-yellow text-black';
    case 'green':
      return 'bg-expiry-green text-white';
    default:
      return 'bg-gray-200 text-black';
  }
}

/**
 * Get days remaining until expiry
 * @param expiryDate Expiry date to check
 * @returns Number of days remaining (negative if expired)
 */
export function getDaysRemaining(expiryDate: Date | string): number {
  const dateObj = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
  const today = new Date();
  return differenceInDays(dateObj, today);
}

/**
 * Format days remaining as a readable string
 * @param daysRemaining Number of days remaining
 * @returns Formatted string (e.g., "Expires today", "Expires in 5 days", "Expired 3 days ago")
 */
export function formatDaysRemaining(daysRemaining: number): string {
  if (daysRemaining === 0) {
    return 'Expires today';
  } else if (daysRemaining < 0) {
    return `Expired ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} ago`;
  } else {
    return `Expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`;
  }
}
