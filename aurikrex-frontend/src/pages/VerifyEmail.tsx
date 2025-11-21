import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Sparkles } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'https://aurikrex-backend.onrender.com/api';

export default function VerifyEmail() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email || '';
  const firstName = location.state?.firstName || '';

  // If no email in state, redirect to signup
  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = useCallback(async (otpValue: string) => {
    if (otpValue.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store user data in localStorage
        const userData = {
          uid: data.data.uid,
          email: data.data.email,
          firstName: data.data.firstName,
          lastName: data.data.lastName,
          emailVerified: true,
          token: data.data.token,
        };
        localStorage.setItem('aurikrex-user', JSON.stringify(userData));
        localStorage.setItem('aurikrex-token', data.data.token);
        
        toast.success('Email verified successfully! 🎉');
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        toast.error(data.message || 'Invalid or expired verification code');
        setOtp('');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [email, navigate]);

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      const response = await fetch(`${API_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Verification code sent! Check your email.');
        setCountdown(60); // 60 seconds cooldown
        setOtp('');
      } else {
        toast.error(data.message || 'Failed to resend code');
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otp.length === 6 && !isLoading) {
      handleVerify(otp);
    }
  }, [otp, isLoading, handleVerify]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-800 px-4 py-8 font-poppins">
      {/* Background Animations */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"
        animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md text-white"
      >
        {/* Back Link */}
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Signup</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl mb-4 shadow-lg"
          >
            <Mail className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Verify Your Email 📧</h1>
          <p className="text-white/70">
            We sent a 6-digit code to
            <br />
            <span className="font-semibold text-white">{email}</span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3 text-center">
            Enter Verification Code
          </label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
              disabled={isLoading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-12 h-14 text-xl bg-white/10 border-white/20 text-white rounded-xl" />
                <InputOTPSlot index={1} className="w-12 h-14 text-xl bg-white/10 border-white/20 text-white rounded-xl" />
                <InputOTPSlot index={2} className="w-12 h-14 text-xl bg-white/10 border-white/20 text-white rounded-xl" />
                <InputOTPSlot index={3} className="w-12 h-14 text-xl bg-white/10 border-white/20 text-white rounded-xl" />
                <InputOTPSlot index={4} className="w-12 h-14 text-xl bg-white/10 border-white/20 text-white rounded-xl" />
                <InputOTPSlot index={5} className="w-12 h-14 text-xl bg-white/10 border-white/20 text-white rounded-xl" />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <p className="text-xs text-white/60 text-center mt-3">
            Code expires in 10 minutes
          </p>
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={isLoading || otp.length !== 6}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-2xl hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-md mb-4"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <motion.div
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              Verifying...
            </span>
          ) : (
            'Verify Email'
          )}
        </button>

        {/* Resend Link */}
        <div className="text-center">
          <p className="text-sm text-white/70 mb-2">Didn't receive the code?</p>
          {countdown > 0 ? (
            <p className="text-sm text-white/50">
              Resend code in {countdown}s
            </p>
          ) : (
            <button
              onClick={handleResendOTP}
              disabled={isResending}
              className="text-sm text-blue-300 hover:text-blue-200 font-semibold transition-colors focus:outline-none focus:underline disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend Code'}
            </button>
          )}
        </div>

        {/* Helper Text */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/80">
              <strong>Pro Tip:</strong> Check your spam folder if you don't see the email.
              The code will auto-verify once all 6 digits are entered.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
