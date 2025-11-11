import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  generateLesson,
  getLesson,
  listLessons,
  updateLesson,
  deleteLesson,
  updateProgress,
  getProgress,
  getUserProgress
} from '../controllers/lessonController.mongo';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for lesson generation
const lessonGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many lesson generation requests. Please try again later.'
});

/**
 * @route   POST /api/lessons/generate
 * @desc    Generate a new AI-powered lesson
 * @access  Private (requires authentication)
 */
router.post(
  '/generate',
  authenticate,
  lessonGenerationLimiter,
  [
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('topic').trim().notEmpty().withMessage('Topic is required'),
    body('targetGrade').isInt({ min: 1, max: 12 }).withMessage('Target grade must be between 1 and 12'),
    body('lessonLength').isIn(['short', 'medium', 'long']).withMessage('Lesson length must be short, medium, or long'),
    body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
    body('additionalInstructions').optional().trim(),
  ],
  validateRequest,
  generateLesson
);

/**
 * @route   GET /api/lessons/:id
 * @desc    Get a lesson by ID
 * @access  Public (optional auth for tracking)
 */
router.get(
  '/:id',
  optionalAuth,
  [
    param('id').isMongoId().withMessage('Invalid lesson ID'),
  ],
  validateRequest,
  getLesson
);

/**
 * @route   GET /api/lessons
 * @desc    List lessons with filters and pagination
 * @access  Public
 */
router.get(
  '/',
  listLessons
);

/**
 * @route   PUT /api/lessons/:id
 * @desc    Update a lesson
 * @access  Private (instructor or admin)
 */
router.put(
  '/:id',
  authenticate,
  authorize('instructor', 'admin'),
  [
    param('id').isMongoId().withMessage('Invalid lesson ID'),
    body('title').optional().trim().notEmpty(),
    body('status').optional().isIn(['draft', 'published', 'archived']),
    body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  ],
  validateRequest,
  updateLesson
);

/**
 * @route   DELETE /api/lessons/:id
 * @desc    Delete a lesson
 * @access  Private (instructor or admin)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('instructor', 'admin'),
  [
    param('id').isMongoId().withMessage('Invalid lesson ID'),
  ],
  validateRequest,
  deleteLesson
);

/**
 * @route   POST /api/lessons/:id/progress
 * @desc    Update lesson progress for current user
 * @access  Private
 */
router.post(
  '/:id/progress',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid lesson ID'),
    body('progress').optional().isInt({ min: 0, max: 100 }),
    body('status').optional().isIn(['not-started', 'in-progress', 'completed']),
    body('timeSpent').optional().isInt({ min: 0 }),
    body('completedSections').optional().isArray(),
  ],
  validateRequest,
  updateProgress
);

/**
 * @route   GET /api/lessons/:id/progress
 * @desc    Get lesson progress for current user
 * @access  Private
 */
router.get(
  '/:id/progress',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid lesson ID'),
  ],
  validateRequest,
  getProgress
);

/**
 * @route   GET /api/lessons/progress/all
 * @desc    Get all lesson progress for current user
 * @access  Private
 */
router.get(
  '/progress/all',
  authenticate,
  getUserProgress
);

export default router;
