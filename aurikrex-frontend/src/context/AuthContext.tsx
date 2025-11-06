import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userData: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          phone: firebaseUser.phoneNumber || undefined,
        };
        setUser(userData);
        localStorage.setItem('aurikrex-user', JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem('aurikrex-user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || email.split('@')[0],
      };
      setUser(userData);
      localStorage.setItem('aurikrex-user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (name: string, email: string, phone: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name,
        phone,
      };
      setUser(userData);
      localStorage.setItem('aurikrex-user', JSON.stringify(userData));
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        phone: firebaseUser.phoneNumber || undefined,
      };
      setUser(userData);
      localStorage.setItem('aurikrex-user', JSON.stringify(userData));
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('aurikrex-user');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if Firebase logout fails, clear local state
      setUser(null);
      localStorage.removeItem('aurikrex-user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
