/**
 * Assignment Routes
 * 
 * Routes for assignment and solution management in Aurikrex Academy.
 * These routes require authentication.
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createAssignment,
  analyzeAssignment,
  getAssignments,
  getAssignment,
  getAssignmentStats,
  deleteAssignment,
  submitSolution,
  verifySolution,
  getSolutions,
  getSolutionStats
} from '../controllers/assignmentController.js';

const router = Router();

// ============================================
// Assignment Routes
// ============================================

/**
 * @route   POST /api/assignments
 * @desc    Create a new assignment
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  [
    body('title')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Title must be less than 200 characters'),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('assignmentType')
      .notEmpty()
      .isIn(['upload', 'text'])
      .withMessage('Assignment type must be "upload" or "text"'),
    body('textContent')
      .optional()
      .isString()
      .isLength({ max: 50000 })
      .withMessage('Text content must be less than 50000 characters'),
    body('fileUrl')
      .optional()
      .isURL()
      .withMessage('File URL must be a valid URL'),
    body('fileName')
      .optional()
      .isString()
      .isLength({ max: 255 })
      .withMessage('File name must be less than 255 characters'),
    body('fileType')
      .optional()
      .isString()
      .withMessage('File type must be a string'),
    body('deadline')
      .optional()
      .isISO8601()
      .withMessage('Deadline must be a valid ISO 8601 date'),
  ],
  validateRequest,
  createAssignment
);

/**
 * @route   GET /api/assignments
 * @desc    Get all assignments for the current user
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  [
    query('status')
      .optional()
      .isIn(['pending', 'analyzed', 'attempted', 'submitted', 'graded'])
      .withMessage('Invalid status value'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('skip')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Skip must be a non-negative integer'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'updatedAt', 'deadline'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be "asc" or "desc"'),
  ],
  validateRequest,
  getAssignments
);

/**
 * @route   GET /api/assignments/stats
 * @desc    Get assignment statistics for the current user
 * @access  Private
 */
router.get('/stats', authenticate, getAssignmentStats);

/**
 * @route   GET /api/assignments/:id
 * @desc    Get a single assignment by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid assignment ID'),
  ],
  validateRequest,
  getAssignment
);

/**
 * @route   POST /api/assignments/:id/analyze
 * @desc    Analyze an assignment using FalkeAI
 * @access  Private
 */
router.post(
  '/:id/analyze',
  authenticate,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid assignment ID'),
  ],
  validateRequest,
  analyzeAssignment
);

/**
 * @route   DELETE /api/assignments/:id
 * @desc    Delete an assignment
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid assignment ID'),
  ],
  validateRequest,
  deleteAssignment
);

// ============================================
// Solution Routes
// ============================================

/**
 * @route   POST /api/assignments/solutions
 * @desc    Submit a solution for an assignment
 * @access  Private
 */
router.post(
  '/solutions',
  authenticate,
  [
    body('assignmentId')
      .notEmpty()
      .isMongoId()
      .withMessage('Valid assignment ID is required'),
    body('solutionType')
      .notEmpty()
      .isIn(['file', 'text'])
      .withMessage('Solution type must be "file" or "text"'),
    body('textContent')
      .optional()
      .isString()
      .isLength({ max: 50000 })
      .withMessage('Text content must be less than 50000 characters'),
    body('fileUrl')
      .optional()
      .isURL()
      .withMessage('File URL must be a valid URL'),
    body('fileName')
      .optional()
      .isString()
      .isLength({ max: 255 })
      .withMessage('File name must be less than 255 characters'),
    body('fileType')
      .optional()
      .isString()
      .withMessage('File type must be a string'),
  ],
  validateRequest,
  submitSolution
);

/**
 * @route   GET /api/assignments/solutions
 * @desc    Get all solutions for the current user
 * @access  Private
 */
router.get(
  '/solutions',
  authenticate,
  [
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
  getSolutions
);

/**
 * @route   GET /api/assignments/solutions/stats
 * @desc    Get solution statistics for the current user
 * @access  Private
 */
router.get('/solutions/stats', authenticate, getSolutionStats);

/**
 * @route   POST /api/assignments/solutions/:id/verify
 * @desc    Verify a solution using FalkeAI
 * @access  Private
 */
router.post(
  '/solutions/:id/verify',
  authenticate,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid solution ID'),
  ],
  validateRequest,
  verifySolution
);

export default router;
