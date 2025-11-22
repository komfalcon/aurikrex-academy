/**
 * Utility functions for handling redirects
 */

/**
 * Extracts the path from a full URL
 * @param url - Full URL (e.g., 'https://aurikrex.tech/dashboard')
 * @returns Path only (e.g., '/dashboard'). Returns '/' for URLs without a path.
 */
export const extractPathFromUrl = (url: string): string => {
  const path = url.replace(/^https?:\/\/[^/]+/, '');
  // Return '/' for root URLs (empty path)
  return path || '/';
};
