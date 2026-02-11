/**
 * SignupPage - Main signup page component
 * Includes email signup form, Google signup button, and links to login
 */
import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  usePasswordValidation,
  validateSignupForm,
  type SignupFormData,
  type FormErrors
} from '../hooks/useValidation';

// Available user roles
const USER_ROLES = ['Student', 'Teacher', 'Admin'] as const;

// Features displayed in the header
const FEATURES = [
  { icon: '🎓', text: 'Access 100+ curated courses' },
  { icon: '📊', text: 'Track your learning progress' },
  { icon: '🏆', text: 'Earn certificates & badges' },
  { icon: '👥', text: 'Join a community of learners' }
];

export function SignupPage() {
  const navigate = useNavigate();
  
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
  
  // Password validation hook
  const { requirements: passwordRequirements, isValid: isPasswordValid } = usePasswordValidation(formData.password);
  
  // Focus state for animations
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitAttempted(true);

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
      navigate('/verify-email');
    }
  };

  // Handle Google signup (placeholder)
  const handleGoogleSignup = () => {
    // Placeholder function for Google OAuth integration
    console.log('Google signup clicked - OAuth integration pending');
    alert('Google signup will be available soon!');
  };

  // Input field styling classes
  const getInputClasses = (fieldName: string, hasError: boolean) => `
    w-full px-4 py-3 rounded-lg
    bg-white dark:bg-slate-800
    border-2 ${hasError ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'}
    text-gray-900 dark:text-white
    placeholder-gray-400 dark:placeholder-gray-500
    transition-all duration-300 ease-in-out
    ${focusedField === fieldName ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-900 border-primary-500' : ''}
    hover:border-primary-400 dark:hover:border-primary-500
    focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
    dark:focus:ring-offset-slate-900
  `;

  return (
    <div className="min-h-screen w-full">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Branding & Features */}
        <div className="lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 dark:from-primary-800 dark:via-primary-900 dark:to-secondary-900 p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto animate-fade-in">
            {/* Logo */}
            <div className="mb-8">
              <Logo size="lg" className="text-white [&_span]:!text-white [&_.text-gray-600]:!text-primary-100" />
            </div>

            {/* Hero Text */}
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Join the Future! 🚀
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Start your learning journey today
            </p>

            {/* Features List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white/90 mb-4">
                What you'll get:
              </h3>
              {FEATURES.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 text-white/90 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="text-lg">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="lg:w-1/2 p-8 lg:p-12 flex items-center justify-center bg-gray-50 dark:bg-slate-900">
          <div className="w-full max-w-md animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Create your account
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Fill in your details to get started
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Fields - Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                {/* Password Requirements */}
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                        req.met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <span className={`transition-transform duration-300 ${req.met ? 'scale-110' : ''}`}>
                        {req.met ? '✓' : '○'}
                      </span>
                      <span>{req.label}</span>
                    </div>
                  ))}
                </div>
                {errors.password && submitAttempted && !formData.password && (
                  <p className="mt-1 text-sm text-red-500 animate-shake">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <div>
                <label htmlFor="institution" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number <span className="text-gray-400">(Optional)</span>
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
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <label htmlFor="agreedToTerms" className="text-sm text-gray-600 dark:text-gray-400">
                  I agree to the{' '}
                  <a href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.agreedToTerms && (
                <p className="text-sm text-red-500 animate-shake -mt-2">{errors.agreedToTerms}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="
                  w-full py-3 px-4 rounded-lg
                  bg-gradient-to-r from-primary-600 to-secondary-600
                  hover:from-primary-700 hover:to-secondary-700
                  text-white font-semibold
                  shadow-lg shadow-primary-500/25
                  transition-all duration-300 ease-in-out
                  hover:shadow-xl hover:shadow-primary-500/40
                  hover:-translate-y-0.5
                  active:translate-y-0 active:shadow-md
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                  dark:focus:ring-offset-slate-900
                "
              >
                Create Account
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Signup Button */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                className="
                  w-full py-3 px-4 rounded-lg
                  bg-white dark:bg-slate-800
                  border-2 border-gray-200 dark:border-slate-700
                  text-gray-700 dark:text-gray-200 font-medium
                  flex items-center justify-center gap-3
                  transition-all duration-300 ease-in-out
                  hover:bg-gray-50 dark:hover:bg-slate-700
                  hover:border-gray-300 dark:hover:border-slate-600
                  hover:shadow-md
                  active:scale-[0.98]
                  focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
                  dark:focus:ring-offset-slate-900
                "
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
              <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
                Already have an account?{' '}
                <a
                  href="/login"
                  className="text-primary-600 dark:text-primary-400 hover:underline font-semibold"
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
