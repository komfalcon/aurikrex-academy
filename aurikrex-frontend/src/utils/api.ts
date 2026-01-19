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

  constructor(
    message: string,
    options?: {
      status?: number;
      statusText?: string;
      requestUrl?: string;
      responseData?: unknown;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status;
    this.statusText = options?.statusText;
    this.requestUrl = options?.requestUrl;
    this.responseData = options?.responseData;
  }
}

/**
 * Get the JWT token from localStorage
 */
export const getToken = (): string | null => {
  return localStorage.getItem('aurikrex-token');
};

/**
 * Make an authenticated API request with comprehensive error handling
 * 
 * @param endpoint - API endpoint (can be relative like '/auth/user' or absolute URL)
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Response object
 * @throws ApiError on network or HTTP errors
 */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for session support
      mode: 'cors', // Explicitly enable CORS
    });

    // Log response details for debugging
    if (!response.ok) {
      console.error('❌ API Error:', {
        url,
        status: response.status,
        statusText: response.statusText,
      });
    }

    return response;
  } catch (error) {
    // Handle network-level errors
    const err = error as Error;
    console.error('❌ Network Error:', {
      url,
      errorMessage: err.message,
      errorName: err.name,
      hint: err.message === 'Failed to fetch' 
        ? 'Check CORS configuration, network connectivity, and API URL'
        : undefined,
    });
    
    throw new ApiError(
      `Network request failed: ${err.message}`,
      { requestUrl: url }
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
