import { Router } from 'express';
import { body } from 'express-validator';
import {
  signup,
  login,
  verifyOTP,
  resendOTP,
  googleSignIn,
  getCurrentUser,
} from '../controllers/authController.js';

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/signup',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 10 })
      .withMessage('Password must be at least 10 characters')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/\d/)
      .withMessage('Password must contain at least one digit')
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage('Password must contain at least one special character'),
    body('phone').optional().trim(),
  ],
  signup
);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP sent to user's email
 * @access  Public
 */
router.post(
  '/verify-otp',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  verifyOTP
);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP to user's email
 * @access  Public
 */
router.post(
  '/resend-otp',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
  resendOTP
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email and password
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

/**
 * @route   POST /api/auth/google
 * @desc    Sign in with Google
 * @access  Public
 */
router.post(
  '/google',
  [body('idToken').notEmpty().withMessage('ID token is required')],
  googleSignIn
);

/**
 * @route   POST /api/auth/me
 * @desc    Get current user data
 * @access  Private
 */
router.post(
  '/me',
  [body('uid').notEmpty().withMessage('User ID is required')],
  getCurrentUser
);

export default router;
