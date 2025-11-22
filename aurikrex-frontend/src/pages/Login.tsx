import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL as string || 'https://aurikrex-backend.onrender.com/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();

  // Force dark mode on this page
  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.classList.contains('dark') ? 'dark' : 'light';
    root.classList.add('dark');
    
    return () => {
      // Restore previous theme on unmount
      if (previousTheme === 'light') {
        root.classList.remove('dark');
      }
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // Login with backend API
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store user data and JWT token
        const userData = {
          uid: data.data.uid,
          email: data.data.email,
          firstName: data.data.firstName,
          lastName: data.data.lastName,
          displayName: data.data.displayName,
          emailVerified: data.data.emailVerified,
          photoURL: data.data.photoURL || null,
        };
        localStorage.setItem('aurikrex-user', JSON.stringify(userData));
        if (data.data.token) {
          localStorage.setItem('aurikrex-token', data.data.token);
        }
        if (data.data.refreshToken) {
          localStorage.setItem('aurikrex-refresh-token', data.data.refreshToken);
        }
        
        toast.success(`Welcome back, ${data.data.firstName}! 👋`);
        
        // Use redirect URL from backend if provided
        if (data.redirect) {
          const redirectPath = data.redirect.replace(/^https?:\/\/[^/]+/, '');
          navigate(redirectPath);
        } else {
          navigate('/dashboard');
        }
      } else if (response.status === 403 && data.emailVerified === false) {
        // Email not verified
        toast.error('Account not verified. Please complete email verification to proceed.');
        setError('Account not verified. Please complete email verification to proceed.');
        
        // Redirect to verify email page
        setTimeout(() => {
          navigate('/verify-email', { state: { email, firstName: data.data?.firstName || '' } });
        }, 2000);
      } else {
        setError(data.message || 'Invalid email or password');
        toast.error(data.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
      const user = JSON.parse(localStorage.getItem('aurikrex-user') || '{}');
      toast.success(`Welcome back, ${user.firstName || user.name}! 🎉`);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled');
        toast.error('Sign-in cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Pop-up blocked. Please enable pop-ups for this site');
        toast.error('Pop-up blocked. Please enable pop-ups for this site');
      } else if (error.message?.includes('No email')) {
        setError('No email associated with this Google account');
        toast.error('No email associated with this Google account');
      } else {
        setError('Failed to sign in with Google. Please try again');
        toast.error('Failed to sign in with Google. Please try again');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-background dark px-4 py-8 font-poppins">
      {/* Animated Background Blobs */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
        animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
        animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-card/50 backdrop-blur-xl border border-border rounded-2xl shadow-card w-full max-w-md p-8"
      >
        {/* Back to Home */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-foreground/80 hover:text-foreground mb-6 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-glow"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">Welcome back to Aurikrex Academy 👋</h1>
          <p className="text-muted-foreground">Continue your learning journey</p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/20 border border-destructive/50 text-destructive-foreground px-4 py-3 rounded-2xl mb-6 text-sm shadow-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-2xl px-10 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="your.email@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-2xl px-10 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="text-right">
            <a
              href="#"
              className="text-sm text-primary hover:text-primary/80 transition-colors focus:outline-none focus:underline"
            >
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-primary text-white font-semibold py-3 rounded-2xl hover:shadow-glow hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-card text-muted-foreground">Or continue with</span>
          </div>
        </div>

        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-secondary border border-border text-foreground font-semibold py-3 rounded-2xl hover:bg-secondary/80 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        <p className="text-center mt-6 text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:text-primary/80 font-semibold transition-colors focus:outline-none focus:underline">
            Sign up here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
