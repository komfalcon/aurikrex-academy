import { Router } from 'express';
import { param, query, body } from 'express-validator';
import {
  getUserLibrary,
  getCurrentlyReading,
  startReading,
  addToWantToRead,
  updateProgress,
  markComplete,
  updateStatus,
  rateBook,
  updateNotes,
  removeFromLibrary,
  getReadingStats,
  checkBookInLibrary,
} from '../controllers/userLibraryController.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/user-library
 * @desc    Get user's library
 * @access  Private
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['want-to-read', 'reading', 'completed']).withMessage('Invalid status'),
    query('sortBy').optional().isIn(['lastReadAt', 'startedAt', 'progress', 'personalRating']).withMessage('Invalid sort option'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order'),
  ],
  validateRequest,
  getUserLibrary
);

/**
 * @route   GET /api/user-library/reading
 * @desc    Get currently reading books
 * @access  Private
 */
router.get('/reading', getCurrentlyReading);

/**
 * @route   GET /api/user-library/stats
 * @desc    Get user's reading stats
 * @access  Private
 */
router.get('/stats', getReadingStats);

/**
 * @route   GET /api/user-library/:bookId/check
 * @desc    Check if book is in user's library
 * @access  Private
 */
router.get(
  '/:bookId/check',
  [
    param('bookId').isMongoId().withMessage('Invalid book ID'),
  ],
  validateRequest,
  checkBookInLibrary
);

/**
 * @route   POST /api/user-library/:bookId/start
 * @desc    Start reading a book
 * @access  Private
 */
router.post(
  '/:bookId/start',
  [
    param('bookId').isMongoId().withMessage('Invalid book ID'),
  ],
  validateRequest,
  startReading
);

/**
 * @route   POST /api/user-library/:bookId/want-to-read
 * @desc    Add book to want-to-read list
 * @access  Private
 */
router.post(
  '/:bookId/want-to-read',
  [
    param('bookId').isMongoId().withMessage('Invalid book ID'),
  ],
  validateRequest,
  addToWantToRead
);

/**
 * @route   PUT /api/user-library/:bookId/progress
 * @desc    Update reading progress
 * @access  Private
 */
router.put(
  '/:bookId/progress',
  [
    param('bookId').isMongoId().withMessage('Invalid book ID'),
    body('currentPage').isInt({ min: 0 }).withMessage('Current page must be a non-negative integer'),
  ],
  validateRequest,
  updateProgress
);

/**
 * @route   POST /api/user-library/:bookId/complete
 * @desc    Mark book as complete
 * @access  Private
 */
router.post(
  '/:bookId/complete',
  [
    param('bookId').isMongoId().withMessage('Invalid book ID'),
  ],
  validateRequest,
  markComplete
);

/**
 * @route   PUT /api/user-library/:bookId/status
 * @desc    Update book status
 * @access  Private
 */
router.put(
  '/:bookId/status',
  [
    param('bookId').isMongoId().withMessage('Invalid book ID'),
    body('status').isIn(['want-to-read', 'reading', 'completed']).withMessage('Invalid status'),
  ],
  validateRequest,
  updateStatus
);

/**
 * @route   PUT /api/user-library/:bookId/rate
 * @desc    Rate a book
 * @access  Private
 */
router.put(
  '/:bookId/rate',
  [
    param('bookId').isMongoId().withMessage('Invalid book ID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  ],
  validateRequest,
  rateBook
);

/**
 * @route   PUT /api/user-library/:bookId/notes
 * @desc    Update notes for a book
 * @access  Private
 */
router.put(
  '/:bookId/notes',
  [
    param('bookId').isMongoId().withMessage('Invalid book ID'),
    body('notes').isString().withMessage('Notes must be a string'),
  ],
  validateRequest,
  updateNotes
);

/**
 * @route   DELETE /api/user-library/:bookId
 * @desc    Remove book from library
 * @access  Private
 */
router.delete(
  '/:bookId',
  [
    param('bookId').isMongoId().withMessage('Invalid book ID'),
  ],
  validateRequest,
  removeFromLibrary
);

export default router;
