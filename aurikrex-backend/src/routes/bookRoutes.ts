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

export default router;
