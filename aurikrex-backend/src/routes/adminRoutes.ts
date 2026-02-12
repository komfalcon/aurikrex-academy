/**
 * Admin Routes
 * 
 * Routes for admin dashboard functionality including:
 * - Dashboard statistics
 * - User management
 * - Book management
 * - Admin access verification
 * 
 * All routes require authentication and admin role authorization
 */

import { Router } from 'express';
import { param, query } from 'express-validator';
import {
  getDashboardStats,
  getAllUsers,
  deactivateUser,
  reactivateUser,
  getUserAnalyticsSummary,
  getAllBooks,
  verifyAdminAccess,
} from '../controllers/adminController.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @route   GET /api/admin/verify
 * @desc    Verify admin access - returns whether user has admin role
 * @access  Private (requires authentication, returns 403 if not admin)
 */
router.get('/verify', verifyAdminAccess);

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard statistics
 * @access  Private (admin only)
 */
router.get('/stats', getDashboardStats);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination and filters
 * @access  Private (admin only)
 */
router.get(
  '/users',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('role').optional().isIn(['student', 'instructor', 'admin']).withMessage('Invalid role'),
    query('disabled').optional().isIn(['true', 'false']).withMessage('Disabled must be true or false'),
    query('search').optional().isString(),
  ],
  validateRequest,
  getAllUsers
);

/**
 * @route   PUT /api/admin/users/:userId/deactivate
 * @desc    Deactivate a user account
 * @access  Private (admin only)
 */
router.put(
  '/users/:userId/deactivate',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
  ],
  validateRequest,
  deactivateUser
);

/**
 * @route   PUT /api/admin/users/:userId/reactivate
 * @desc    Reactivate a user account
 * @access  Private (admin only)
 */
router.put(
  '/users/:userId/reactivate',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
  ],
  validateRequest,
  reactivateUser
);

/**
 * @route   GET /api/admin/users/:userId/analytics
 * @desc    Get analytics summary for a specific user
 * @access  Private (admin only)
 */
router.get(
  '/users/:userId/analytics',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
  ],
  validateRequest,
  getUserAnalyticsSummary
);

/**
 * @route   GET /api/admin/books
 * @desc    Get all books with filters
 * @access  Private (admin only)
 */
router.get(
  '/books',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'published']).withMessage('Invalid status'),
    query('search').optional().isString(),
    query('sortBy').optional().isIn(['title', 'rating', 'newest', 'popular', 'downloads']).withMessage('Invalid sort option'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order'),
  ],
  validateRequest,
  getAllBooks
);

export default router;
