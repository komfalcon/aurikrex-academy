/**
 * FalkeAI Analytics Routes
 * 
 * Routes for FalkeAI activity tracking and user analytics in Aurikrex Academy.
 * These routes require authentication.
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  trackActivity,
  getUserAnalytics,
  getAnalyticsSummary,
  getActivities,
  rateActivity,
  getDashboardAnalytics,
  refreshAnalytics
} from '../controllers/falkeaiAnalyticsController.js';

const router = Router();

// ============================================
// Activity Tracking Routes
// ============================================

/**
 * @route   POST /api/falkeai-analytics/track
 * @desc    Track a FalkeAI activity
 * @access  Private
 */
router.post(
  '/track',
  authenticate,
  [
    body('activityType')
      .notEmpty()
      .isIn([
        'chat_question',
        'assignment_upload',
        'assignment_analysis',
        'solution_upload',
        'solution_verification',
        'quiz_explanation',
        'progress_analysis',
        'recommendation',
        'concept_explanation',
        'performance_review',
        'lesson_generation'
      ])
      .withMessage('Invalid activity type'),
    body('timeSpent')
      .notEmpty()
      .isInt({ min: 0 })
      .withMessage('Time spent must be a non-negative integer'),
    body('courseId')
      .optional()
      .isString()
      .withMessage('Course ID must be a string'),
    body('lessonId')
      .optional()
      .isString()
      .withMessage('Lesson ID must be a string'),
    body('assignmentId')
      .optional()
      .isString()
      .withMessage('Assignment ID must be a string'),
    body('quizId')
      .optional()
      .isString()
      .withMessage('Quiz ID must be a string'),
    body('question')
      .optional()
      .isString()
      .isLength({ max: 5000 })
      .withMessage('Question must be less than 5000 characters'),
    body('questionType')
      .optional()
      .isString()
      .withMessage('Question type must be a string'),
    body('responseLength')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Response length must be a non-negative integer'),
    body('resultType')
      .optional()
      .isIn(['success', 'needs_improvement', 'not_attempted', 'error'])
      .withMessage('Invalid result type'),
    body('resultScore')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Result score must be between 0 and 100'),
  ],
  validateRequest,
  trackActivity
);

// ============================================
// Analytics Retrieval Routes
// ============================================

/**
 * @route   GET /api/falkeai-analytics
 * @desc    Get user analytics
 * @access  Private
 */
router.get('/', authenticate, getUserAnalytics);

/**
 * @route   GET /api/falkeai-analytics/summary
 * @desc    Get a quick summary of user analytics for the dashboard
 * @access  Private
 */
router.get('/summary', authenticate, getAnalyticsSummary);

/**
 * @route   GET /api/falkeai-analytics/dashboard
 * @desc    Get comprehensive dashboard analytics
 * @access  Private
 */
router.get('/dashboard', authenticate, getDashboardAnalytics);

/**
 * @route   GET /api/falkeai-analytics/activities
 * @desc    Get user activities with filtering
 * @access  Private
 */
router.get(
  '/activities',
  authenticate,
  [
    query('activityType')
      .optional()
      .isIn([
        'chat_question',
        'assignment_upload',
        'assignment_analysis',
        'solution_upload',
        'solution_verification',
        'quiz_explanation',
        'progress_analysis',
        'recommendation',
        'concept_explanation',
        'performance_review',
        'lesson_generation'
      ])
      .withMessage('Invalid activity type'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('skip')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Skip must be a non-negative integer'),
  ],
  validateRequest,
  getActivities
);

/**
 * @route   POST /api/falkeai-analytics/rate/:activityId
 * @desc    Rate an activity
 * @access  Private
 */
router.post(
  '/rate/:activityId',
  authenticate,
  [
    param('activityId')
      .isMongoId()
      .withMessage('Invalid activity ID'),
    body('rating')
      .notEmpty()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
  ],
  validateRequest,
  rateActivity
);

/**
 * @route   POST /api/falkeai-analytics/refresh
 * @desc    Force refresh user analytics
 * @access  Private
 */
router.post('/refresh', authenticate, refreshAnalytics);

export default router;
