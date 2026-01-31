import { Router } from 'express';
import { param, query, body } from 'express-validator';
import {
  getBooks,
  getBook,
  searchBooks,
  getBooksByCategory,
  getCategories,
  createBook,
  updateBook,
  deleteBook,
  uploadBook,
  downloadBook,
  addReview,
  getBookReviews,
  getPendingBooks,
  approveBook,
  rejectBook,
  getCategoriesFormatted,
} from '../controllers/bookController.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/books
 * @desc    Get all books with pagination and filters
 * @access  Public
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('category').optional().isString(),
    query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level'),
    query('sortBy').optional().isIn(['title', 'rating', 'newest', 'popular']).withMessage('Invalid sort option'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order'),
  ],
  validateRequest,
  getBooks
);

/**
 * @route   GET /api/books/search
 * @desc    Search books by title, author, or description
 * @access  Public
 */
router.get(
  '/search',
  [
    query('q').notEmpty().withMessage('Search query is required'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  searchBooks
);

/**
 * @route   GET /api/books/categories
 * @desc    Get all unique book categories
 * @access  Public
 */
router.get('/categories', getCategories);

/**
 * @route   GET /api/books/categories/all
 * @desc    Get all book categories with icons and colors
 * @access  Public
 */
router.get('/categories/all', getCategoriesFormatted);

/**
 * @route   GET /api/books/admin/pending
 * @desc    Get pending books for approval
 * @access  Private (admin only)
 */
router.get(
  '/admin/pending',
  authenticate,
  authorize('admin'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  getPendingBooks
);

/**
 * @route   GET /api/books/category/:category
 * @desc    Get books by category
 * @access  Public
 */
router.get(
  '/category/:category',
  [
    param('category').notEmpty().withMessage('Category is required'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  getBooksByCategory
);

/**
 * @route   GET /api/books/:id
 * @desc    Get a single book by ID
 * @access  Public
 */
router.get(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid book ID'),
  ],
  validateRequest,
  getBook
);

/**
 * @route   POST /api/books
 * @desc    Create a new book
 * @access  Private (admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('author').trim().notEmpty().withMessage('Author is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').isArray({ min: 1 }).withMessage('At least one category is required'),
    body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level'),
    body('coverImageUrl').isURL().withMessage('Valid cover image URL is required'),
    body('pdfUrl').isURL().withMessage('Valid PDF URL is required'),
    body('fileSize').isFloat({ min: 0 }).withMessage('File size must be a positive number'),
    body('pages').isInt({ min: 1 }).withMessage('Pages must be a positive integer'),
    body('yearPublished').isInt({ min: 1800, max: new Date().getFullYear() }).withMessage('Invalid year'),
    body('concepts').optional().isArray(),
    body('targetAudience').optional().isString(),
    body('relatedCourses').optional().isArray(),
  ],
  validateRequest,
  createBook
);

/**
 * @route   PUT /api/books/:id
 * @desc    Update a book
 * @access  Private (admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid book ID'),
    body('title').optional().trim().notEmpty(),
    body('author').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('category').optional().isArray(),
    body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
    body('coverImageUrl').optional().isURL(),
    body('pdfUrl').optional().isURL(),
    body('fileSize').optional().isFloat({ min: 0 }),
    body('pages').optional().isInt({ min: 1 }),
    body('yearPublished').optional().isInt({ min: 1800, max: new Date().getFullYear() }),
  ],
  validateRequest,
  updateBook
);

/**
 * @route   DELETE /api/books/:id
 * @desc    Delete a book
 * @access  Private (admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid book ID'),
  ],
  validateRequest,
  deleteBook
);

/**
 * @route   POST /api/books/upload
 * @desc    Upload a book (student uploads)
 * @access  Private (authenticated)
 */
router.post(
  '/upload',
  authenticate,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('author').optional().trim(),
    body('description').optional().trim(),
    body('category').optional().isIn(['textbook', 'reference', 'notes', 'slides', 'research', 'material', 'other']),
    body('subject').optional().trim(),
    body('fileUrl').notEmpty().withMessage('File URL is required'),
    body('fileName').optional().trim(),
    body('fileSize').optional().isFloat({ min: 0 }),
    body('fileType').optional().isIn(['pdf', 'epub', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'png', 'jpg']),
  ],
  validateRequest,
  uploadBook
);

/**
 * @route   POST /api/books/:id/download
 * @desc    Track book download
 * @access  Private (authenticated)
 */
router.post(
  '/:id/download',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid book ID'),
  ],
  validateRequest,
  downloadBook
);

/**
 * @route   POST /api/books/:id/review
 * @desc    Add a review to a book
 * @access  Private (authenticated)
 */
router.post(
  '/:id/review',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid book ID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('reviewText').optional().trim(),
  ],
  validateRequest,
  addReview
);

/**
 * @route   GET /api/books/:id/reviews
 * @desc    Get reviews for a book
 * @access  Public
 */
router.get(
  '/:id/reviews',
  [
    param('id').isMongoId().withMessage('Invalid book ID'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  validateRequest,
  getBookReviews
);

/**
 * @route   PUT /api/books/admin/:id/approve
 * @desc    Approve a book
 * @access  Private (admin only)
 */
router.put(
  '/admin/:id/approve',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid book ID'),
  ],
  validateRequest,
  approveBook
);

/**
 * @route   PUT /api/books/admin/:id/reject
 * @desc    Reject a book
 * @access  Private (admin only)
 */
router.put(
  '/admin/:id/reject',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid book ID'),
    body('reason').optional().trim(),
  ],
  validateRequest,
  rejectBook
);

export default router;
