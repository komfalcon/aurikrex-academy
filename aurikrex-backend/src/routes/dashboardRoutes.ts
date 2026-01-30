/**
 * Dashboard Routes
 * 
 * API routes for dashboard data in Aurikrex Academy.
 * These routes require authentication.
 */

import { Router } from 'express';
import { query } from 'express-validator';
import { validateRequest } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getDashboardData,
  getOverviewStats,
  getRecentActivity,
  getAnalytics,
  getQuickStats,
} from '../controllers/dashboardController.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/dashboard/data
 * @desc    Get comprehensive dashboard data
 * @access  Private
 */
router.get('/data', getDashboardData);

/**
 * @route   GET /api/dashboard/overview
 * @desc    Get overview statistics for dashboard header
 * @access  Private
 */
router.get('/overview', getOverviewStats);

/**
 * @route   GET /api/dashboard/activity
 * @desc    Get recent activity feed
 * @access  Private
 */
router.get(
  '/activity',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ],
  validateRequest,
  getRecentActivity
);

/**
 * @route   GET /api/dashboard/analytics
 * @desc    Get learning analytics
 * @access  Private
 */
router.get('/analytics', getAnalytics);

/**
 * @route   GET /api/dashboard/quick-stats
 * @desc    Get quick stats for dashboard header
 * @access  Private
 */
router.get('/quick-stats', getQuickStats);

export default router;
