import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleVerifyEmail = () => {
    if (email && email.includes('@')) {
      // Mock verification
      setTimeout(() => {
        setEmailVerified(true);
      }, 500);
    } else {
      setError('Please enter a valid email address');
    }
  };

  const handleVerifyPhone = () => {
    if (phone && phone.length >= 10) {
      // Mock verification
      setTimeout(() => {
        setPhoneVerified(true);
      }, 500);
    } else {
      setError('Please enter a valid phone number');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name || !email || !phone || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!emailVerified) {
      setError('Please verify your email address');
      return;
    }

    if (!phoneVerified) {
      setError('Please verify your phone number');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await signup(name, email, phone, password);
      console.log('Registration successful:', { name, email, phone });
      navigate('/dashboard');
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-800 px-4 py-8 font-poppins">
      {/* Animated Background Blobs */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        animate={{
          x: [0, -100, 0],
          y: [0, -50, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md text-white"
      >
        {/* Back to Home */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
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
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl mb-4 shadow-lg"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Join the Future of Learning 🚀</h1>
          <p className="text-white/70">Create your Aurikrex Academy account</p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-2xl mb-6 text-sm shadow-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-10 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          {/* Email with Verification */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailVerified(false);
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl px-10 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/15 transition-all"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleVerifyEmail}
                disabled={emailVerified}
                className={`px-4 py-3 rounded-2xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm ${
                  emailVerified
                    ? 'bg-green-500 text-white cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 hover:scale-105 text-white'
                }`}
              >
                {emailVerified ? <CheckCircle className="w-5 h-5" /> : 'Verify'}
              </button>
            </div>
            {emailVerified && (
              <p className="text-green-400 text-sm mt-1 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Email verified ✅
              </p>
            )}
          </div>

          {/* Phone with Verification */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2">
              Phone Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneVerified(false);
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl px-10 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/15 transition-all"
                  placeholder="+1234567890"
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleVerifyPhone}
                disabled={phoneVerified}
                className={`px-4 py-3 rounded-2xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm ${
                  phoneVerified
                    ? 'bg-green-500 text-white cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 hover:scale-105 text-white'
                }`}
              >
                {phoneVerified ? <CheckCircle className="w-5 h-5" /> : 'Verify'}
              </button>
            </div>
            {phoneVerified && (
              <p className="text-green-400 text-sm mt-1 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Phone verified ✅
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-10 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/15 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-10 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/15 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-2xl hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Privacy Notice */}
        <p className="text-xs text-white/50 text-center mt-4">
          We'll never share your data. See our Privacy Policy.
        </p>

        {/* Login Link */}
        <p className="text-center mt-6 text-white/70">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-blue-300 hover:text-blue-200 font-semibold transition-colors focus:outline-none focus:underline"
          >
            Login here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
