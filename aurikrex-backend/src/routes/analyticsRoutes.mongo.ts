import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  trackCompletion,
  trackExercise,
  getLessonAnalytics,
  getUserEngagement,
  getAllUserEngagement
} from '../controllers/analyticsController.mongo.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   POST /api/analytics/lessons/:id/completion
 * @desc    Track lesson completion
 * @access  Private
 */
router.post(
  '/lessons/:id/completion',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid lesson ID'),
    body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a positive number'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('struggledSections').optional().isArray(),
  ],
  validateRequest,
  trackCompletion
);

/**
 * @route   POST /api/analytics/lessons/:id/exercises/:exerciseId
 * @desc    Track exercise attempt
 * @access  Private
 */
router.post(
  '/lessons/:id/exercises/:exerciseId',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid lesson ID'),
    param('exerciseId').notEmpty().withMessage('Exercise ID is required'),
    body('correct').isBoolean().withMessage('Correct field must be boolean'),
    body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a positive number'),
    body('attempts').isInt({ min: 1 }).withMessage('Attempts must be at least 1'),
  ],
  validateRequest,
  trackExercise
);

/**
 * @route   GET /api/analytics/lessons/:id
 * @desc    Get lesson analytics
 * @access  Private (instructor or admin)
 */
router.get(
  '/lessons/:id',
  authenticate,
  authorize('instructor', 'admin'),
  [
    param('id').isMongoId().withMessage('Invalid lesson ID'),
  ],
  validateRequest,
  getLessonAnalytics
);

/**
 * @route   GET /api/analytics/lessons/:id/engagement
 * @desc    Get user engagement for a specific lesson
 * @access  Private
 */
router.get(
  '/lessons/:id/engagement',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid lesson ID'),
  ],
  validateRequest,
  getUserEngagement
);

/**
 * @route   GET /api/analytics/engagement
 * @desc    Get all user engagement data
 * @access  Private
 */
router.get(
  '/engagement',
  authenticate,
  getAllUserEngagement
);

export default router;
