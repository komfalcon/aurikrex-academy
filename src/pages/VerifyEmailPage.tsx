/**
 * VerifyEmailPage - OTP verification page component
 * Includes 6-digit OTP input, countdown timer, and resend functionality
 */
import { useState, useEffect, useRef, type KeyboardEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';

// OTP length constant
const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 60;

export function VerifyEmailPage() {
  const navigate = useNavigate();
  
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
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Card Container */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-slate-700">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="md" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verify your email
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              We've sent a 6-digit verification code to
            </p>
            <p className="text-primary-600 dark:text-primary-400 font-semibold mt-1">
              {email}
            </p>
          </div>

          {/* OTP Input */}
          <div className="mb-6">
            <div className="flex justify-center gap-3">
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
                    w-12 h-14 sm:w-14 sm:h-16
                    text-center text-2xl font-bold
                    rounded-lg border-2
                    ${digit ? 'border-primary-500' : 'border-gray-200 dark:border-slate-600'}
                    ${error ? 'border-red-500 animate-shake' : ''}
                    ${success ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
                    bg-white dark:bg-slate-700
                    text-gray-900 dark:text-white
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:border-primary-400
                  `}
                />
              ))}
            </div>
            
            {/* Error Message */}
            {error && (
              <p className="text-center text-red-500 text-sm mt-3 animate-fade-in">
                {error}
              </p>
            )}
            
            {/* Success Message */}
            {success && (
              <p className="text-center text-green-600 dark:text-green-400 text-sm mt-3 animate-fade-in flex items-center justify-center gap-2">
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
              w-full py-3 px-4 rounded-lg
              font-semibold text-white
              transition-all duration-300 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              dark:focus:ring-offset-slate-800
              ${success
                ? 'bg-green-600 cursor-default'
                : 'bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md'
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
          <div className="mt-6 text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="
                  text-primary-600 dark:text-primary-400 font-semibold
                  hover:underline transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 mx-auto
                "
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
              <p className="text-gray-500 dark:text-gray-400">
                Resend code in{' '}
                <span className={`
                  font-mono font-semibold
                  ${countdown <= 10 ? 'text-red-500 animate-pulse-custom' : 'text-primary-600 dark:text-primary-400'}
                  transition-colors duration-300
                `}>
                  {formatTime(countdown)}
                </span>
              </p>
            )}
          </div>

          {/* Back to Signup */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
            <button
              onClick={() => navigate('/signup')}
              className="
                w-full text-center text-gray-600 dark:text-gray-400
                hover:text-primary-600 dark:hover:text-primary-400
                transition-colors duration-200
                flex items-center justify-center gap-2
              "
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to signup
            </button>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
          Didn't receive the code? Check your spam folder or{' '}
          <button
            onClick={() => alert('Contact support: support@aurikrex-academy.com')}
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            contact support
          </button>
        </p>
      </div>
    </div>
  );
}
