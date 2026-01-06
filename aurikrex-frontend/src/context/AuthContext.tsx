import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { validateToken } from '../utils/api';

/**
 * Backend API URL - Must be configured via VITE_API_URL environment variable
 * 
 * Local development: http://localhost:5000/api
 * Production: https://api.aurikrex.tech/api
 */
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.warn('⚠️ VITE_API_URL is not set. Authentication will fail. Please configure your environment variables.');
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
   */
  const signInWithProvider = async (provider: OAuthProvider) => {
    try {
      console.log(`🔐 Initiating ${provider} OAuth flow...`);
      
      // Check if API URL is configured
      if (!API_URL) {
        throw new Error('Backend API URL is not configured. Please contact support.');
      }
      
      // Get OAuth URL from backend
      const urlResponse = await fetch(`${API_URL}/auth/${provider}/url`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to get ${provider} OAuth URL`);
      }

      const responseData = await urlResponse.json();
      
      if (!responseData.success || !responseData.data?.url) {
        throw new Error(responseData.message || 'Invalid response from authentication server');
      }

      const oauthUrl = responseData.data.url;
      console.log(`✅ Got ${provider} OAuth URL, redirecting...`);

      // Redirect to OAuth provider
      window.location.href = oauthUrl;
    } catch (error) {
      console.error(`❌ Error signing in with ${provider}:`, error);
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
