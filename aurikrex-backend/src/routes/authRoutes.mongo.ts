import { Router } from 'express';
import { body } from 'express-validator';
import {
  getCurrentUser,
  refreshTokenHandler,
  logout,
  googleAuthInit,
  googleAuthCallback,
  microsoftAuthInit,
  microsoftAuthCallback,
  githubAuthInit,
  githubAuthCallback,
} from '../controllers/authController.mongo.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// ============================================
// OAuth Routes - Google
// ============================================

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

// ============================================
// OAuth Routes - Microsoft
// ============================================

/**
 * @route   GET /api/auth/microsoft/url
 * @desc    Get Microsoft OAuth URL to initiate authentication
 * @access  Public
 */
router.get('/microsoft/url', microsoftAuthInit);

/**
 * @route   GET /api/auth/microsoft/callback
 * @desc    Handle Microsoft OAuth callback after user authorizes
 * @access  Public
 */
router.get('/microsoft/callback', microsoftAuthCallback as any);

// ============================================
// OAuth Routes - GitHub
// ============================================

/**
 * @route   GET /api/auth/github/url
 * @desc    Get GitHub OAuth URL to initiate authentication
 * @access  Public
 */
router.get('/github/url', githubAuthInit);

/**
 * @route   GET /api/auth/github/callback
 * @desc    Handle GitHub OAuth callback after user authorizes
 * @access  Public
 */
router.get('/github/callback', githubAuthCallback);

// ============================================
// Token & User Management
// ============================================

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  validateRequest,
  refreshTokenHandler
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
 * @route   POST /api/auth/logout
 * @desc    Logout user (clear cookies)
 * @access  Public
 */
router.post('/logout', logout);

export default router;
