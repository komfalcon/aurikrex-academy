import { Router } from 'express';
import { body } from 'express-validator';
import {
  signup,
  login,
  verifyOTP,
  resendOTP,
  getCurrentUser,
  refreshToken,
  googleAuthInit,
  googleAuthCallback
} from '../controllers/authController.mongo.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

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
    body('role').optional().isIn(['student', 'instructor', 'admin']).withMessage('Invalid role'),
  ],
  validateRequest,
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
  validateRequest,
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
  validateRequest,
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
  validateRequest,
  login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  validateRequest,
  refreshToken
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user data
 * @access  Private (requires authentication)
 */
router.get(
  '/me',
  authenticate,
  getCurrentUser
);

/**
 * @route   GET /api/auth/google/url
 * @desc    Get Google OAuth URL to initiate authentication
 * @access  Public
 */
router.get('/google/url', googleAuthInit);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth callback after user authorizes
 * @access  Public
 */
router.get('/google/callback', googleAuthCallback as any);

export default router;
