/**
 * API utility for making authenticated requests to the backend
 * 
 * IMPORTANT: Set VITE_API_URL in your environment variables:
 * - Local development: http://localhost:5000/api
 * - Production (Vercel): https://api.aurikrex.tech/api
 * 
 * Required Vercel Environment Variables:
 * - VITE_API_URL: Backend API URL (e.g., https://api.aurikrex.tech/api)
 * - VITE_FRONTEND_URL: Frontend URL for redirects (e.g., https://aurikrex.tech)
 * 
 * CORS Requirements:
 * - Backend must allow the frontend origin in Access-Control-Allow-Origin
 * - Backend must allow credentials if using cookies
 * - Backend must NOT use wildcard (*) origin when credentials are enabled
 */

const API_URL = import.meta.env.VITE_API_URL;

// Default timeout for API requests (30 seconds)
const DEFAULT_TIMEOUT = 30000;

if (!API_URL) {
  console.warn('⚠️ VITE_API_URL is not set. API calls will fail. Please configure your environment variables.');
}

/**
 * Custom error class for API errors with additional context
 */
export class ApiError extends Error {
  public readonly status?: number;
  public readonly statusText?: string;
  public readonly requestUrl?: string;
  public readonly responseData?: unknown;
  public readonly isTimeout?: boolean;
  public readonly isNetworkError?: boolean;

  constructor(
    message: string,
    options?: {
      status?: number;
      statusText?: string;
      requestUrl?: string;
      responseData?: unknown;
      isTimeout?: boolean;
      isNetworkError?: boolean;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status;
    this.statusText = options?.statusText;
    this.requestUrl = options?.requestUrl;
    this.responseData = options?.responseData;
    this.isTimeout = options?.isTimeout;
    this.isNetworkError = options?.isNetworkError;
  }
}

/**
 * Get the JWT token from localStorage
 */
export const getToken = (): string | null => {
  return localStorage.getItem('aurikrex-token');
};

/**
 * Make an authenticated API request with comprehensive error handling and timeout support
 * 
 * @param endpoint - API endpoint (can be relative like '/auth/user' or absolute URL)
 * @param options - Fetch options (method, body, headers, etc.)
 * @param timeout - Optional timeout in milliseconds (default: 30000)
 * @returns Response object
 * @throws ApiError on network or HTTP errors
 */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> => {
  const token = getToken();
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  const requestTimestamp = new Date().toISOString();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    console.log(`📡 API Request: ${options.method || 'GET'} ${url}`, {
      hasAuth: !!token,
      timestamp: requestTimestamp,
      timeout,
    });
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for session support
      mode: 'cors', // Explicitly enable CORS
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Log response details for debugging
    if (!response.ok) {
      console.error('❌ API Error:', {
        url,
        status: response.status,
        statusText: response.statusText,
        timestamp: requestTimestamp,
      });
    } else {
      console.log(`✅ API Response: ${response.status} ${response.statusText}`, {
        url,
        timestamp: requestTimestamp,
      });
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle timeout (AbortError)
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ API Timeout:', {
        url,
        timeout,
        timestamp: requestTimestamp,
      });
      throw new ApiError(
        `Request timed out after ${timeout / 1000} seconds`,
        { requestUrl: url, isTimeout: true }
      );
    }
    
    // Handle network-level errors
    const err = error instanceof Error ? error : new Error(String(error));
    
    // Build hints array for debugging
    const hints: string[] = [];
    if (err.message === 'Failed to fetch') {
      hints.push('Check CORS configuration, network connectivity, and API URL');
    }
    if (!API_URL) {
      hints.push('VITE_API_URL environment variable is not set');
    }
    
    console.error('❌ Network Error:', {
      url,
      errorMessage: err.message,
      errorName: err.name,
      timestamp: requestTimestamp,
      hints: hints.length > 0 ? hints : undefined,
    });
    
    // Provide more helpful error messages
    let errorMessage = `Network request failed: ${err.message}`;
    
    if (err.message === 'Failed to fetch') {
      errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    
    throw new ApiError(
      errorMessage,
      { requestUrl: url, isNetworkError: true }
    );
  }
};

/**
 * Validate JWT token
 */
export const validateToken = (): boolean => {
  const token = getToken();
  
  if (!token) {
    return false;
  }

  try {
    // Basic JWT validation - check if it has 3 parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};
