/**
 * Utility functions for handling redirects
 */

/**
 * Extracts the path from a full URL
 * @param url - Full URL (e.g., 'https://aurikrex.tech/dashboard')
 * @returns Path only (e.g., '/dashboard'). Returns '/' for URLs without a path.
 */
export const extractPathFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const fullPath = urlObj.pathname + urlObj.search + urlObj.hash;
    // Return '/' for root URLs (empty path)
    return fullPath || '/';
  } catch (error) {
    // Fallback for invalid URLs - try regex approach
    console.warn('Invalid URL provided to extractPathFromUrl:', url);
    const path = url.replace(/^https?:\/\/[^/]+/, '');
    return path || '/';
  }
};
