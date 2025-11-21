/**
 * API utility for making authenticated requests to the backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://aurikrex-backend.onrender.com/api';

/**
 * Get the JWT token from localStorage
 */
export const getToken = (): string | null => {
  return localStorage.getItem('aurikrex-token');
};

/**
 * Make an authenticated API request
 */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  return fetch(url, {
    ...options,
    headers,
  });
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
