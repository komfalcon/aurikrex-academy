import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { validateToken } from '../utils/api';

/**
 * Backend API URL - Must be configured via VITE_API_URL environment variable
 * 
 * Local development: http://localhost:5000/api
 * Production (Digital Ocean): https://your-app.ondigitalocean.app/api
 */
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.warn('⚠️ VITE_API_URL is not set. Authentication will fail. Please configure your environment variables.');
}

interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  photoURL?: string;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, phone: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('aurikrex-user');
        localStorage.removeItem('aurikrex-token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Login logic is handled in Login.tsx component
    // This is a placeholder
    console.log('Login called with:', email);
  };

  const signup = async (firstName: string, lastName: string, email: string, phone: string, password: string) => {
    // Signup logic is handled in Signup.tsx component
    // This is a placeholder
    console.log('Signup called with:', firstName, lastName, email);
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Initiating Google OAuth flow...');
      
      // Step 1: Get Google OAuth URL from backend
      const urlResponse = await fetch(`${API_URL}/auth/google/url`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get Google OAuth URL');
      }

      const responseData = await urlResponse.json();
      
      if (!responseData.success || !responseData.data?.url) {
        throw new Error('Invalid response from authentication server');
      }

      const googleAuthUrl = responseData.data.url;
      console.log('✅ Got Google OAuth URL, redirecting...');

      // Step 2: Redirect to Google OAuth
      // Google will redirect back to /auth/callback with tokens
      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error('❌ Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aurikrex-user');
    localStorage.removeItem('aurikrex-token');
    localStorage.removeItem('pending-verification-email');
    localStorage.removeItem('pending-verification-firstName');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, signInWithGoogle, logout }}>
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
