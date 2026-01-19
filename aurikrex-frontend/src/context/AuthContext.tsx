import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { validateToken } from '../utils/api';

/**
 * Backend API URL - Must be configured via VITE_API_URL environment variable
 * 
 * Local development: http://localhost:5000/api
 * Production: https://api.aurikrex.tech/api
 */
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Validate that the API URL is properly configured for the environment
 */
const validateApiUrl = (): { valid: boolean; error?: string } => {
  if (!API_URL) {
    return { 
      valid: false, 
      error: 'VITE_API_URL is not set. Authentication will fail. Please configure your environment variables.' 
    };
  }
  
  // In production, require HTTPS
  const isProduction = import.meta.env.PROD;
  if (isProduction && !API_URL.startsWith('https://')) {
    console.warn('⚠️ VITE_API_URL should use HTTPS in production for security.');
  }
  
  // Validate URL format
  try {
    new URL(API_URL);
  } catch {
    return { 
      valid: false, 
      error: `VITE_API_URL is not a valid URL: ${API_URL}` 
    };
  }
  
  return { valid: true };
};

const apiUrlValidation = validateApiUrl();
if (!apiUrlValidation.valid) {
  console.warn(`⚠️ ${apiUrlValidation.error}`);
}

// Supported OAuth providers
type OAuthProvider = 'google' | 'microsoft' | 'github';

interface User {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  photoURL?: string;
  emailVerified?: boolean;
  provider?: OAuthProvider;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithProvider: (provider: OAuthProvider) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('aurikrex-user');
    const token = localStorage.getItem('aurikrex-token');
    
    if (storedUser && token) {
      try {
        // Validate token before setting user
        if (validateToken()) {
          setUser(JSON.parse(storedUser));
        } else {
          // Token is invalid or expired, clear storage
          localStorage.removeItem('aurikrex-user');
          localStorage.removeItem('aurikrex-token');
          localStorage.removeItem('aurikrex-refresh-token');
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('aurikrex-user');
        localStorage.removeItem('aurikrex-token');
        localStorage.removeItem('aurikrex-refresh-token');
      }
    }
    setLoading(false);
  }, []);

  /**
   * Sign in with OAuth provider (Google, Microsoft, or GitHub)
   * 
   * This function fetches the OAuth authorization URL from the backend
   * and redirects the user to the OAuth provider's login page.
   * The OAuth flow will redirect back to /auth/callback with tokens.
   */
  const signInWithProvider = async (provider: OAuthProvider) => {
    const requestUrl = `${API_URL}/auth/${provider}/url`;
    
    try {
      console.log(`🔐 Initiating ${provider} OAuth flow...`);
      console.log(`📡 Request URL: ${requestUrl}`);
      
      // Check if API URL is configured
      if (!API_URL) {
        const error = new Error('Backend API URL is not configured. Please contact support.');
        console.error('❌ OAuth Error:', {
          error: error.message,
          hint: 'Set VITE_API_URL environment variable in Vercel dashboard',
        });
        throw error;
      }
      
      // Get OAuth URL from backend
      // Include credentials for cookie-based session support
      // mode: 'cors' explicitly enables CORS requests
      const urlResponse = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include', // Required for cookies/sessions
        mode: 'cors', // Explicitly enable CORS
      }).catch((networkError: Error) => {
        // Handle network-level errors (CORS, DNS, connection refused, etc.)
        console.error('❌ Network error during OAuth:', {
          requestUrl,
          error: networkError.message,
          name: networkError.name,
          stack: networkError.stack,
        });
        
        // Provide helpful error messages for common issues
        if (networkError.message === 'Failed to fetch') {
          throw new Error(
            `Unable to connect to authentication server. This may be due to:\n` +
            `• Network connectivity issues\n` +
            `• CORS misconfiguration (backend must allow origin: ${window.location.origin})\n` +
            `• Invalid API URL: ${requestUrl}\n` +
            `• Backend server not running\n` +
            `Please check browser console for details.`
          );
        }
        throw networkError;
      });

      console.log(`📥 Response received:`, {
        status: urlResponse.status,
        statusText: urlResponse.statusText,
        headers: Object.fromEntries(urlResponse.headers.entries()),
      });

      if (!urlResponse.ok) {
        let errorData: { message?: string } = {};
        try {
          errorData = await urlResponse.json();
        } catch {
          // Response is not JSON, use status text
        }
        
        console.error('❌ OAuth URL request failed:', {
          requestUrl,
          status: urlResponse.status,
          statusText: urlResponse.statusText,
          errorData,
        });
        
        throw new Error(
          errorData.message || 
          `Failed to get ${provider} OAuth URL (HTTP ${urlResponse.status})`
        );
      }

      const responseData = await urlResponse.json();
      
      if (!responseData.success || !responseData.data?.url) {
        console.error('❌ Invalid OAuth response:', {
          requestUrl,
          responseData,
        });
        throw new Error(responseData.message || 'Invalid response from authentication server');
      }

      const oauthUrl = responseData.data.url;
      console.log(`✅ Got ${provider} OAuth URL, redirecting...`);
      console.log(`🔗 Redirect URL: ${oauthUrl.substring(0, 100)}...`);

      // Redirect to OAuth provider (browser redirect, not fetch)
      // This is correct - OAuth flows require full page redirect
      window.location.href = oauthUrl;
    } catch (error) {
      // Comprehensive error logging for debugging
      const err = error as Error;
      console.error(`❌ Error signing in with ${provider}:`, {
        requestUrl,
        errorMessage: err.message,
        errorName: err.name,
        errorStack: err.stack,
        currentOrigin: window.location.origin,
        apiUrl: API_URL,
      });
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aurikrex-user');
    localStorage.removeItem('aurikrex-token');
    localStorage.removeItem('aurikrex-refresh-token');
    
    // Also call backend logout to clear cookies
    if (API_URL) {
      fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      }).catch(console.error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithProvider, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
