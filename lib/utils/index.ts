import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names using clsx and tailwind-merge
 * @param inputs Class names to combine
 * @returns Combined class name string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a currency value
 * @param value Number to format as currency
 * @param currency Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value)
}

/**
 * Truncates a string to a specified length
 * @param str String to truncate
 * @param length Maximum length
 * @returns Truncated string with ellipsis if needed
 */
export function truncateString(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

/**
 * Generates a random color based on a string
 * @param str Input string
 * @returns Hex color code
 */
export function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  let color = '#'
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF
    color += ('00' + value.toString(16)).substr(-2)
  }
  return color
}

/**
 * Checks if the app is running in a PWA (standalone mode)
 * @returns Boolean indicating if running as PWA
 */
export function isPwa(): boolean {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(display-mode: standalone)').matches
  }
  return false
}

/**
 * Checks if the device is offline
 * @returns Boolean indicating if device is offline
 */
export function isOffline(): boolean {
  if (typeof navigator !== 'undefined') {
    return !navigator.onLine
  }
  return false
}
