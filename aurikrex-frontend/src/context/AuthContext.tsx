import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('aurikrex-user');
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
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser: FirebaseUser = result.user;

      if (!firebaseUser.email) {
        throw new Error('No email associated with this Google account');
      }

      // Get ID token
      const idToken = await firebaseUser.getIdToken();

      // Send to backend for processing
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const user: User = {
          uid: data.data.uid,
          email: data.data.email,
          firstName: data.data.firstName,
          lastName: data.data.lastName,
          displayName: data.data.displayName,
          photoURL: data.data.photoURL || undefined,
          emailVerified: true, // Google users are pre-verified
        };

        setUser(user);
        localStorage.setItem('aurikrex-user', JSON.stringify(user));
      } else {
        throw new Error(data.message || 'Google sign-in failed');
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aurikrex-user');
    localStorage.removeItem('aurikrex-token');
    localStorage.removeItem('pending-verification-email');
    localStorage.removeItem('pending-verification-firstName');
    auth.signOut();
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
