/**
 * API configuration for the Aurikrex Academy frontend.
 *
 * The backend URL is auto-detected based on the build environment:
 * - Development:  http://localhost:3000
 * - Production:   https://zonal-megen-falkyblinders-09833153.koyeb.app
 *                 (Koyeb deployment — update this constant if the deployment URL changes)
 *
 * Set the VITE_API_URL environment variable to override the auto-detected URL.
 */

/** Production backend URL (Koyeb deployment) */
export const PRODUCTION_API_URL = 'https://zonal-megen-falkyblinders-09833153.koyeb.app';

/** Development backend URL */
export const DEVELOPMENT_API_URL = 'http://localhost:3000';

/**
 * Resolved API base URL.
 * Prefers the VITE_API_URL environment variable, then falls back to
 * environment-based detection.
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? DEVELOPMENT_API_URL : PRODUCTION_API_URL);
