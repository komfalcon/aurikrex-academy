/**
 * SignupPage - Main signup page component
 * Includes email signup form, Google signup button, and links to login
 * Features animated background, smooth transitions, and proper dark/light mode support
 */
import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { useTheme } from '../hooks/useTheme';
import {
  usePasswordValidation,
  validateSignupForm,
  type SignupFormData,
  type FormErrors
} from '../hooks/useValidation';

// Available user roles
const USER_ROLES = ['Student', 'Teacher', 'Admin'] as const;

// Features displayed in the header with animated icons
const FEATURES = [
  { icon: '🎓', text: 'Access 100+ curated courses', delay: 100 },
  { icon: '📊', text: 'Track your learning progress', delay: 200 },
  { icon: '🏆', text: 'Earn certificates & badges', delay: 300 },
  { icon: '👥', text: 'Join a community of learners', delay: 400 }
];

export function SignupPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  // Page load animation state
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Trigger fade-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  // Form state
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    institution: '',
    role: '',
    phoneNumber: '',
    agreedToTerms: false
  });
  
  // Error state
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  
  // Button animation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Password validation hook
  const { requirements: passwordRequirements, isValid: isPasswordValid } = usePasswordValidation(formData.password);
  
  // Focus state for animations
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Hover state for feature icons
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  // Handle input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error on field change if submit was attempted
    if (submitAttempted && errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setIsSubmitting(true);

    // Validate form
    const validationErrors = validateSignupForm(formData);
    
    // Check password requirements
    if (!isPasswordValid) {
      validationErrors.password = 'Password does not meet all requirements';
    }

    setErrors(validationErrors);

    // If no errors, proceed to OTP verification
    if (Object.keys(validationErrors).length === 0) {
      // Store email for OTP page (placeholder for backend integration)
      sessionStorage.setItem('signupEmail', formData.email);
      sessionStorage.setItem('signupData', JSON.stringify(formData));
      
      // Small delay for button animation feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      navigate('/verify-email');
    }
    
    setIsSubmitting(false);
  };

  // Handle Google signup (placeholder)
  const handleGoogleSignup = () => {
    // Placeholder function for Google OAuth integration
    console.log('Google signup clicked - OAuth integration pending');
    alert('Google signup will be available soon!');
  };

  // Input field styling classes with enhanced animations
  const getInputClasses = (fieldName: string, hasError: boolean) => `
    w-full px-4 py-3 rounded-xl
    ${theme === 'dark' 
      ? 'bg-slate-800/80 backdrop-blur-sm border-slate-600' 
      : 'bg-white/90 backdrop-blur-sm border-gray-200'
    }
    border-2 ${hasError ? 'border-red-500' : ''}
    ${theme === 'dark' ? 'text-white' : 'text-gray-900'}
    ${theme === 'dark' ? 'placeholder-gray-400' : 'placeholder-gray-500'}
    transition-all duration-300 ease-out
    ${focusedField === fieldName 
      ? `ring-2 ${theme === 'dark' ? 'ring-primary-400' : 'ring-primary-500'} ring-offset-2 ${theme === 'dark' ? 'ring-offset-slate-900' : 'ring-offset-white'} border-primary-500 shadow-lg ${theme === 'dark' ? 'shadow-primary-500/20' : 'shadow-primary-500/30'}` 
      : ''
    }
    hover:border-primary-400 hover:shadow-md
    focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
    ${theme === 'dark' ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-white'}
    transform hover:scale-[1.01] focus:scale-[1.01]
  `;

  // Label styling classes for proper dark/light mode
  const labelClasses = `block text-sm font-semibold mb-2 transition-colors duration-300 ${
    theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
  }`;

  return (
    <div className={`min-h-screen w-full relative overflow-hidden transition-colors duration-500 ${
      theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'
    }`}>
      {/* Animated Background with educational icons */}
      <AnimatedBackground itemCount={25} />
      
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Branding & Features */}
        <div className={`lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center transition-colors duration-500 ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-primary-900/90 via-primary-800/85 to-secondary-900/90 backdrop-blur-sm'
            : 'bg-gradient-to-br from-primary-600/95 via-primary-700/90 to-secondary-700/95 backdrop-blur-sm'
        }`}>
          <div 
            className={`max-w-md mx-auto transition-all duration-700 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Logo with animation */}
            <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
              <Logo size="lg" className="text-white [&_span]:!text-white [&_.text-gray-600]:!text-primary-100" />
            </div>

            {/* Hero Text with gradient animation */}
            <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              Join the Future! 
              <span className="inline-block ml-2 animate-bounce">🚀</span>
            </h1>
            <p className={`text-xl mb-10 transition-colors duration-500 ${
              theme === 'dark' ? 'text-primary-200' : 'text-primary-100'
            }`}>
              Start your learning journey today
            </p>

            {/* Features List with hover animations */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-white/95 mb-6 tracking-wide uppercase text-sm">
                ✨ What you'll get:
              </h3>
              {FEATURES.map((feature, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 text-white/90 p-3 rounded-xl transition-all duration-300 cursor-default ${
                    isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                  } ${hoveredFeature === index 
                    ? `${theme === 'dark' ? 'bg-white/10' : 'bg-white/15'} shadow-lg transform scale-105` 
                    : 'hover:bg-white/5'
                  }`}
                  style={{ 
                    transitionDelay: `${feature.delay}ms`,
                    animationDelay: `${feature.delay}ms`
                  }}
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <span 
                    className={`text-3xl transition-transform duration-300 ${
                      hoveredFeature === index ? 'scale-125 animate-icon-bounce' : ''
                    }`}
                  >
                    {feature.icon}
                  </span>
                  <span className="text-lg font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className={`lg:w-1/2 p-8 lg:p-12 flex items-center justify-center transition-colors duration-500 ${
          theme === 'dark' ? 'bg-slate-900/80 backdrop-blur-md' : 'bg-white/80 backdrop-blur-md'
        }`}>
          <div 
            className={`w-full max-w-md transition-all duration-700 delay-200 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className={`text-3xl font-bold mb-2 transition-colors duration-500 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Create your account
            </h2>
            <p className={`mb-8 text-lg transition-colors duration-500 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Fill in your details to get started
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Fields - Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div className="group">
                  <label htmlFor="firstName" className={labelClasses}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('firstName')}
                    onBlur={() => setFocusedField(null)}
                    className={getInputClasses('firstName', !!errors.firstName)}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-500 animate-shake">{errors.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div className="group">
                  <label htmlFor="lastName" className={labelClasses}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('lastName')}
                    onBlur={() => setFocusedField(null)}
                    className={getInputClasses('lastName', !!errors.lastName)}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-500 animate-shake">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="group">
                <label htmlFor="email" className={labelClasses}>
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={getInputClasses('email', !!errors.email)}
                  placeholder="john.doe@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500 animate-shake">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="group">
                <label htmlFor="password" className={labelClasses}>
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className={getInputClasses('password', !!errors.password)}
                  placeholder="••••••••"
                />
                {/* Password Requirements with animated indicators */}
                <div className={`mt-3 p-3 rounded-lg transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-50'
                }`}>
                  <div className="space-y-1.5">
                    {passwordRequirements.map((req, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                          req.met 
                            ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') 
                            : (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')
                        }`}
                      >
                        <span className={`transition-all duration-300 ${req.met ? 'scale-110 text-lg' : 'text-sm'}`}>
                          {req.met ? '✓' : '○'}
                        </span>
                        <span className={`${req.met ? 'font-medium' : ''}`}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {errors.password && submitAttempted && !formData.password && (
                  <p className="mt-1 text-sm text-red-500 animate-shake">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="group">
                <label htmlFor="confirmPassword" className={labelClasses}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  className={getInputClasses('confirmPassword', !!errors.confirmPassword)}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500 animate-shake">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Institution */}
              <div className="group">
                <label htmlFor="institution" className={labelClasses}>
                  Institution/School Name *
                </label>
                <input
                  type="text"
                  id="institution"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('institution')}
                  onBlur={() => setFocusedField(null)}
                  className={getInputClasses('institution', !!errors.institution)}
                  placeholder="Enter your school or institution"
                />
                {errors.institution && (
                  <p className="mt-1 text-sm text-red-500 animate-shake">{errors.institution}</p>
                )}
              </div>

              {/* Role Dropdown */}
              <div className="group">
                <label htmlFor="role" className={labelClasses}>
                  User Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('role')}
                  onBlur={() => setFocusedField(null)}
                  className={`${getInputClasses('role', !!errors.role)} cursor-pointer`}
                >
                  <option value="">Select your role</option>
                  {USER_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-500 animate-shake">{errors.role}</p>
                )}
              </div>

              {/* Phone Number (Optional) */}
              <div className="group">
                <label htmlFor="phoneNumber" className={labelClasses}>
                  Phone Number <span className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>(Optional)</span>
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('phoneNumber')}
                  onBlur={() => setFocusedField(null)}
                  className={getInputClasses('phoneNumber', false)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreedToTerms"
                  name="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={handleChange}
                  className={`mt-1 w-5 h-5 rounded-md transition-all duration-200 cursor-pointer ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border-slate-600 text-primary-500 focus:ring-primary-400' 
                      : 'bg-white border-gray-300 text-primary-600 focus:ring-primary-500'
                  } focus:ring-2 focus:ring-offset-2 ${theme === 'dark' ? 'focus:ring-offset-slate-900' : ''}`}
                />
                <label htmlFor="agreedToTerms" className={`text-sm transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  I agree to the{' '}
                  <a href="/terms" className={`font-medium hover:underline transition-colors duration-200 ${
                    theme === 'dark' ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'
                  }`}>
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className={`font-medium hover:underline transition-colors duration-200 ${
                    theme === 'dark' ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'
                  }`}>
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.agreedToTerms && (
                <p className="text-sm text-red-500 animate-shake -mt-2">{errors.agreedToTerms}</p>
              )}

              {/* Submit Button with loading state */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`
                  w-full py-3.5 px-4 rounded-xl
                  bg-gradient-to-r from-primary-600 to-secondary-600
                  hover:from-primary-500 hover:to-secondary-500
                  text-white font-semibold text-lg
                  shadow-lg transition-all duration-300 ease-out
                  hover:shadow-2xl hover:-translate-y-1
                  active:translate-y-0 active:shadow-lg
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                  ${theme === 'dark' ? 'focus:ring-offset-slate-900 shadow-primary-500/30 hover:shadow-primary-500/50' : 'shadow-primary-500/25 hover:shadow-primary-500/40'}
                  disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0
                  relative overflow-hidden
                `}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Account
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t transition-colors duration-300 ${
                    theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
                  }`}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className={`px-4 transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-slate-900/80 text-gray-400' : 'bg-white/80 text-gray-500'
                  }`}>
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Signup Button */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                className={`
                  w-full py-3.5 px-4 rounded-xl
                  border-2 font-medium
                  flex items-center justify-center gap-3
                  transition-all duration-300 ease-out
                  hover:shadow-lg hover:-translate-y-0.5
                  active:scale-[0.98] active:translate-y-0
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${theme === 'dark' 
                    ? 'bg-slate-800/80 border-slate-600 text-gray-200 hover:bg-slate-700 hover:border-slate-500 focus:ring-slate-500 focus:ring-offset-slate-900' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:ring-gray-400'
                  }
                `}
              >
                {/* Google Icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </button>

              {/* Login Link */}
              <p className={`text-center mt-8 transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Already have an account?{' '}
                <a
                  href="/login"
                  className={`font-semibold transition-all duration-200 hover:underline ${
                    theme === 'dark' 
                      ? 'text-primary-400 hover:text-primary-300' 
                      : 'text-primary-600 hover:text-primary-700'
                  }`}
                >
                  Proceed to login
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
