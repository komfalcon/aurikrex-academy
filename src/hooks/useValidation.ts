/**
 * usePasswordValidation - Custom hook for password validation
 * Checks for minimum length, uppercase, lowercase, digits, and special characters
 */
import { useMemo } from 'react';

export interface PasswordRequirement {
  label: string;
  met: boolean;
}

export function usePasswordValidation(password: string): {
  requirements: PasswordRequirement[];
  isValid: boolean;
} {
  const requirements = useMemo(() => {
    return [
      {
        label: 'Minimum 8 characters',
        met: password.length >= 8
      },
      {
        label: 'At least one uppercase letter',
        met: /[A-Z]/.test(password)
      },
      {
        label: 'At least one lowercase letter',
        met: /[a-z]/.test(password)
      },
      {
        label: 'At least one digit',
        met: /\d/.test(password)
      },
      {
        label: 'At least one special character (!@#$%^&*)',
        met: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      }
    ];
  }, [password]);

  const isValid = requirements.every(req => req.met);

  return { requirements, isValid };
}

/**
 * useFormValidation - Custom hook for signup form validation
 */
export interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  institution: string;
  role: string;
  phoneNumber: string;
  agreedToTerms: boolean;
}

export interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  institution?: string;
  role?: string;
  agreedToTerms?: string;
}

export function validateSignupForm(data: SignupFormData): FormErrors {
  const errors: FormErrors = {};

  // First name validation
  if (!data.firstName.trim()) {
    errors.firstName = 'First name is required';
  }

  // Last name validation
  if (!data.lastName.trim()) {
    errors.lastName = 'Last name is required';
  }

  // Email validation
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Password validation
  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  // Confirm password validation
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // Institution validation
  if (!data.institution.trim()) {
    errors.institution = 'Institution/School name is required';
  }

  // Role validation
  if (!data.role) {
    errors.role = 'Please select a role';
  }

  // Terms agreement validation
  if (!data.agreedToTerms) {
    errors.agreedToTerms = 'You must agree to the Terms of Service and Privacy Policy';
  }

  return errors;
}
