/**
 * Utility functions for handling redirects
 */

/**
 * Extracts the path from a full URL
 * @param url - Full URL (e.g., 'https://aurikrex.tech/dashboard')
 * @returns Path only (e.g., '/dashboard')
 */
export const extractPathFromUrl = (url: string): string => {
  return url.replace(/^https?:\/\/[^/]+/, '');
};
