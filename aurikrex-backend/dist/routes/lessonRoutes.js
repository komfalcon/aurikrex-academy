import { Router } from 'express';
import { generateLesson, getLessonById, listLessons, getLessonProgress, updateLessonProgress } from '../controllers/lessonController.js';
import { aiLimiter } from '../middleware/rate-limit.middleware.js';
import { sanitizeAndValidate } from '../middleware/sanitization.middleware.js';
import { body, query, param } from 'express-validator';
const router = Router();
/**
 * @route POST /api/lessons/generate
 * @description Generate a new lesson based on provided parameters
 * @access Public
 */
router.post('/generate', [
    // Input validation and sanitization
    body('subject').trim().notEmpty().escape(),
    body('topic').trim().notEmpty().escape(),
    body('targetGrade').isInt({ min: 1, max: 12 }),
    body('lessonLength').isIn(['short', 'medium', 'long']),
    body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
    body('additionalInstructions').optional().trim().escape(),
    sanitizeAndValidate,
    aiLimiter, // Apply AI rate limiting
    generateLesson
]);
/**
 * @route GET /api/lessons
 * @description List lessons with optional filters
 * @access Public
 */
router.get('/', [
    query('subject').optional().trim().escape(),
    query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
    query('status').optional().isIn(['draft', 'published', 'archived']),
    sanitizeAndValidate,
    listLessons
]);
/**
 * @route GET /api/lessons/:id
 * @description Get a specific lesson by ID
 * @access Public
 */
router.get('/:id', [
    param('id').trim().notEmpty(),
    sanitizeAndValidate,
    getLessonById
]);
/**
 * @route GET /api/lessons/:id/progress
 * @description Get lesson progress for current user
 * @access Private
 */
router.get('/:id/progress', [
    param('id').trim().notEmpty(),
    sanitizeAndValidate,
    getLessonProgress
]);
/**
 * @route PUT /api/lessons/:id/progress
 * @description Update lesson progress
 * @access Private
 */
router.put('/:id/progress', [
    param('id').trim().notEmpty(),
    body('status').optional().isIn(['not-started', 'in-progress', 'completed']),
    body('progress').optional().isFloat({ min: 0, max: 100 }),
    body('timeSpent').optional().isInt({ min: 0 }),
    body('completedSections').optional().isArray(),
    sanitizeAndValidate,
    updateLessonProgress
]);
export default router;
//# sourceMappingURL=lessonRoutes.js.map