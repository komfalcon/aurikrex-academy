import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, ArrowLeft, Sparkles, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { extractPathFromUrl } from '../utils/redirect';

const API_URL = import.meta.env.VITE_API_URL as string || 'https://aurikrex-backend.onrender.com/api';

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  // Password validation rules
  const passwordRules = {
    minLength: password.length >= 10,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const allRulesMet = Object.values(passwordRules).every(Boolean);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const formValid = firstName && lastName && email && allRulesMet && passwordsMatch;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      toast.error('Please fill in all required fields');
      return;
    }
    if (!allRulesMet) {
      setError('Password does not meet all requirements');
      toast.error('Password does not meet all requirements');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password, phone }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Account created! Check your email for verification code.');
        // Store email and firstName temporarily for verification page
        localStorage.setItem('pending-verification-email', email);
        localStorage.setItem('pending-verification-firstName', firstName);
        
        // Use redirect URL from backend if provided, otherwise navigate to verification page
        if (data.redirect) {
          // Extract path from redirect URL
          const redirectPath = extractPathFromUrl(data.redirect);
          navigate(redirectPath, { state: { email, firstName } });
        } else {
          // Fallback to default verification page
          navigate('/verify-email', { state: { email, firstName } });
        }
      } else {
        setError(data.message || 'Registration failed. Please try again.');
        toast.error(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Network error. Please check your connection and try again.');
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Signed in with Google successfully! 🎉');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled');
        toast.error('Sign-in cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Pop-up blocked. Please enable pop-ups');
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

  const PasswordRuleItem = ({ met, text }: { met: boolean; text: string }) => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2"
    >
      {met ? (
        <Check className="w-4 h-4 text-accent" />
      ) : (
        <X className="w-4 h-4 text-destructive" />
      )}
      <span className={`text-xs ${met ? 'text-accent' : 'text-destructive'}`}>
        {text}
      </span>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-background dark px-4 py-8 font-poppins">
      {/* Background Animations */}
      <motion.div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
        animate={{ x: [0, 100, 0], y: [0, 50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}/>
      <motion.div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
        animate={{ x: [0, -100, 0], y: [0, -50, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}/>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative bg-card/50 backdrop-blur-xl border border-border rounded-2xl shadow-card w-full max-w-md p-8">

        {/* Back Link */}
        <Link to="/" className="inline-flex items-center gap-2 text-foreground/80 hover:text-foreground mb-6 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-primary">
          <ArrowLeft className="w-4 h-4" /> <span className="text-sm">Back to Home</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-glow">
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">Join the Future of Learning 🚀</h1>
          <p className="text-muted-foreground">Create your Aurikrex Academy account</p>
        </div>

        {/* Error Message */}
        {error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/20 border border-destructive/50 text-destructive-foreground px-4 py-3 rounded-2xl mb-6 text-sm shadow-sm">{error}</motion.div>}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* First Name & Last Name (Side by Side) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-2 text-foreground">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-2xl px-10 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="John" required/>
              </div>
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-2 text-foreground">Last Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-2xl px-10 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Doe" required/>
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-2xl px-10 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="your.email@example.com" required/>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2 text-foreground">Phone Number <span className="text-muted-foreground text-xs">(Optional)</span></label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-2xl px-10 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="+1234567890"/>
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-secondary/50 border rounded-2xl px-10 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  password && allRulesMet ? 'border-accent focus:ring-accent' : 'border-border focus:ring-primary'
                }`}
                placeholder="••••••••" required/>
            </div>
            {/* Password Rules */}
            {password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 p-3 bg-secondary/30 rounded-xl space-y-1"
              >
                <PasswordRuleItem met={passwordRules.minLength} text="At least 10 characters" />
                <PasswordRuleItem met={passwordRules.hasUppercase} text="One uppercase letter" />
                <PasswordRuleItem met={passwordRules.hasLowercase} text="One lowercase letter" />
                <PasswordRuleItem met={passwordRules.hasDigit} text="One digit" />
                <PasswordRuleItem met={passwordRules.hasSpecialChar} text="One special character (!@#$%^&*)" />
              </motion.div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-foreground">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full bg-secondary/50 border rounded-2xl px-10 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  confirmPassword && passwordsMatch ? 'border-accent focus:ring-accent' : 'border-border focus:ring-primary'
                }`}
                placeholder="••••••••" required/>
            </div>
            {confirmPassword && !passwordsMatch && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-destructive mt-2 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Passwords do not match
              </motion.p>
            )}
            {confirmPassword && passwordsMatch && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-accent mt-2 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Passwords match
              </motion.p>
            )}
          </div>

          {/* Submit */}
          <button type="submit" disabled={isLoading || !formValid}
            className="w-full bg-gradient-primary text-white font-semibold py-3 rounded-2xl hover:shadow-glow hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-card text-muted-foreground">Or continue with</span>
          </div>
        </div>

        {/* Google Sign-In */}
        <button type="button" onClick={handleGoogleSignIn} disabled={isLoading}
          className="w-full bg-secondary border border-border text-foreground font-semibold py-3 rounded-2xl hover:bg-secondary/80 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-3">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        {/* Privacy & Login */}
        <p className="text-xs text-muted-foreground text-center mt-4">We'll never share your data. See our Privacy Policy.</p>
        <p className="text-center mt-6 text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors focus:outline-none focus:underline">
            Login here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
