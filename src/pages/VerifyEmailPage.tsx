/**
 * VerifyEmailPage - OTP verification page component
 * Includes 6-digit OTP input, countdown timer, and resend functionality
 * Features animated background and proper dark/light mode support
 */
import { useState, useEffect, useRef, type KeyboardEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { useTheme } from '../hooks/useTheme';

// OTP length constant
const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 60;

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  // Page load animation state
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Trigger fade-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  // Get stored email from signup
  const [email] = useState(() => sessionStorage.getItem('signupEmail') || 'your email');
  
  // OTP input state
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Countdown timer state
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  // Refs for OTP inputs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);
  
  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [countdown]);
  
  // Handle OTP input change
  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d+$/.test(value)) return;
    
    // Clear error on input
    setError(null);
    
    // Handle paste of full OTP
    if (value.length > 1) {
      const digits = value.slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      
      // Focus last filled input or first empty
      const lastIndex = Math.min(index + digits.length - 1, OTP_LENGTH - 1);
      inputRefs.current[lastIndex]?.focus();
      return;
    }
    
    // Update single digit
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  // Handle paste event
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
    
    if (digits.length > 0) {
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        newOtp[i] = digit;
      });
      setOtp(newOtp);
      
      // Focus the last filled input
      const lastIndex = Math.min(digits.length - 1, OTP_LENGTH - 1);
      inputRefs.current[lastIndex]?.focus();
    }
  };
  
  // Handle form submission
  const handleVerify = async () => {
    const otpValue = otp.join('');
    
    if (otpValue.length !== OTP_LENGTH) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    
    setIsVerifying(true);
    setError(null);
    
    // Placeholder for backend integration
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Placeholder validation - in production, verify with backend
      // For demo, accept any 6-digit code
      console.log('Verifying OTP:', otpValue);
      
      setSuccess(true);
      
      // Clear session storage
      sessionStorage.removeItem('signupEmail');
      sessionStorage.removeItem('signupData');
      
      // Navigate to success/dashboard after short delay
      setTimeout(() => {
        alert('Email verified successfully! Redirecting to dashboard...');
        navigate('/');
      }, 1500);
      
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Handle resend code
  const handleResend = async () => {
    if (!canResend || isResending) return;
    
    setIsResending(true);
    setError(null);
    
    // Placeholder for backend integration
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Resending OTP to:', email);
      
      // Reset countdown
      setCountdown(COUNTDOWN_SECONDS);
      setCanResend(false);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };
  
  // Format countdown time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen w-full relative overflow-hidden transition-colors duration-500 ${
      theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'
    }`}>
      {/* Animated Background with educational icons */}
      <AnimatedBackground itemCount={15} />
      
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div 
          className={`w-full max-w-md transition-all duration-700 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Card Container */}
          <div className={`rounded-2xl shadow-2xl p-8 backdrop-blur-md border transition-colors duration-500 ${
            theme === 'dark' 
              ? 'bg-slate-800/90 border-slate-700 shadow-black/20' 
              : 'bg-white/95 border-gray-100 shadow-gray-200/50'
          }`}>
            {/* Logo with animation */}
            <div className="flex justify-center mb-8 transform hover:scale-105 transition-transform duration-300">
              <Logo size="md" />
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className={`text-2xl font-bold mb-3 transition-colors duration-500 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Verify your email ✉️
              </h1>
              <p className={`transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                We've sent a 6-digit verification code to
              </p>
              <p className={`font-semibold mt-2 text-lg transition-colors duration-500 ${
                theme === 'dark' ? 'text-primary-400' : 'text-primary-600'
              }`}>
                {email}
              </p>
            </div>

            {/* OTP Input */}
            <div className="mb-8">
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                  disabled={isVerifying || success}
                  className={`
                    w-11 h-14 sm:w-14 sm:h-16
                    text-center text-2xl font-bold
                    rounded-xl border-2
                    transition-all duration-300 ease-out
                    ${digit 
                      ? (theme === 'dark' ? 'border-primary-400' : 'border-primary-500') 
                      : (theme === 'dark' ? 'border-slate-600' : 'border-gray-200')
                    }
                    ${error ? 'border-red-500 animate-shake' : ''}
                    ${success 
                      ? (theme === 'dark' ? 'border-green-400 bg-green-900/20' : 'border-green-500 bg-green-50') 
                      : ''
                    }
                    ${theme === 'dark' 
                      ? 'bg-slate-700/80 text-white' 
                      : 'bg-white text-gray-900'
                    }
                    focus:outline-none focus:ring-2 focus:border-primary-500 
                    ${theme === 'dark' 
                      ? 'focus:ring-primary-400 focus:ring-offset-slate-800' 
                      : 'focus:ring-primary-500'
                    }
                    focus:ring-offset-2 focus:scale-105
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:border-primary-400 hover:shadow-md
                    transform hover:scale-[1.02]
                  `}
                />
              ))}
            </div>
            
            {/* Error Message */}
            {error && (
              <p className="text-center text-red-500 text-sm mt-4 animate-fade-in font-medium">
                {error}
              </p>
            )}
            
            {/* Success Message */}
            {success && (
              <p className={`text-center text-sm mt-4 animate-fade-in flex items-center justify-center gap-2 font-medium ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Email verified successfully!
              </p>
            )}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={otp.join('').length !== OTP_LENGTH || isVerifying || success}
            className={`
              w-full py-3.5 px-4 rounded-xl
              font-semibold text-white text-lg
              transition-all duration-300 ease-out
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${theme === 'dark' ? 'focus:ring-offset-slate-800' : ''}
              ${success
                ? 'bg-green-600 cursor-default'
                : `bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 shadow-lg hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 active:shadow-lg ${
                    theme === 'dark' ? 'shadow-primary-500/30' : 'shadow-primary-500/25'
                  }`
              }
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg
            `}
          >
            {isVerifying ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying...
              </span>
            ) : success ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Verified!
              </span>
            ) : (
              'Verify Email'
            )}
          </button>

          {/* Countdown & Resend */}
          <div className="mt-8 text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={isResending}
                className={`font-semibold hover:underline transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto ${
                  theme === 'dark' ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'
                }`}
              >
                {isResending ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Resend Code
                  </>
                )}
              </button>
            ) : (
              <p className={`transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Resend code in{' '}
                <span className={`font-mono font-semibold transition-colors duration-300 ${
                  countdown <= 10 
                    ? 'text-red-500 animate-pulse-custom' 
                    : (theme === 'dark' ? 'text-primary-400' : 'text-primary-600')
                }`}>
                  {formatTime(countdown)}
                </span>
              </p>
            )}
          </div>

          {/* Back to Signup */}
          <div className={`mt-8 pt-6 border-t transition-colors duration-300 ${
            theme === 'dark' ? 'border-slate-700' : 'border-gray-100'
          }`}>
            <button
              onClick={() => navigate('/signup')}
              className={`w-full text-center transition-all duration-200 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-opacity-10 ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-primary-400 hover:bg-primary-400' 
                  : 'text-gray-600 hover:text-primary-600 hover:bg-primary-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to signup
            </button>
          </div>
        </div>

        {/* Help Text */}
        <p className={`text-center text-sm mt-6 transition-colors duration-300 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Didn't receive the code? Check your spam folder or{' '}
          <button
            onClick={() => alert('Contact support: support@aurikrex-academy.com')}
            className={`hover:underline transition-colors duration-200 ${
              theme === 'dark' ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'
            }`}
          >
            contact support
          </button>
        </p>
      </div>
      </div>
    </div>
  );
}
