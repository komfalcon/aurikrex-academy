import { Request, Response } from 'express';
import { BookModel, BookDifficulty } from '../models/Book.model.js';
import { log } from '../utils/logger.js';

/**
 * Get all books with pagination and filters
 */
export const getBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '12',
      category,
      difficulty,
      search,
      sortBy,
      sortOrder
    } = req.query;

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      category: category as string | undefined,
      difficulty: difficulty as BookDifficulty | undefined,
      search: search as string | undefined,
      sortBy: sortBy as 'title' | 'rating' | 'newest' | 'popular' | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    };

    const result = await BookModel.list(options);

    res.status(200).json({
      status: 'success',
      data: {
        books: result.books,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      }
    });
  } catch (error) {
    log.error('Error getting books', { error });
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch books'
    });
  }
};

/**
 * Get a single book by ID
 */
export const getBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const book = await BookModel.findById(id);

    if (!book) {
      res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: book
    });
  } catch (error) {
    log.error('Error getting book', { error, bookId: req.params.id });
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch book'
    });
  }
};

/**
 * Search books
 */
export const searchBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, page = '1', limit = '12' } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        status: 'error',
        message: 'Search query (q) is required'
      });
      return;
    }

    const result = await BookModel.list({
      search: q,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });

    res.status(200).json({
      status: 'success',
      data: {
        books: result.books,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      }
    });
  } catch (error) {
    log.error('Error searching books', { error, query: req.query.q });
    res.status(500).json({
      status: 'error',
      message: 'Failed to search books'
    });
  }
};

/**
 * Get books by category
 */
export const getBooksByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = req.params.category as string;
    const { page = '1', limit = '12' } = req.query;

    const result = await BookModel.list({
      category,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });

    res.status(200).json({
      status: 'success',
      data: {
        books: result.books,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      }
    });
  } catch (error) {
    log.error('Error getting books by category', { error, category: req.params.category });
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch books'
    });
  }
};

/**
 * Get all categories
 */
export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await BookModel.getCategories();

    res.status(200).json({
      status: 'success',
      data: categories
    });
  } catch (error) {
    log.error('Error getting categories', { error });
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch categories'
    });
  }
};

/**
 * Create a new book (admin only)
 */
export const createBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookData = req.body;

    const book = await BookModel.create(bookData);

    res.status(201).json({
      status: 'success',
      message: 'Book created successfully',
      data: book
    });
  } catch (error) {
    log.error('Error creating book', { error });
    res.status(500).json({
      status: 'error',
      message: 'Failed to create book'
    });
  }
};

/**
 * Update a book (admin only)
 */
export const updateBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updateData = req.body;

    const book = await BookModel.update(id, updateData);

    if (!book) {
      res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Book updated successfully',
      data: book
    });
  } catch (error) {
    log.error('Error updating book', { error, bookId: req.params.id });
    res.status(500).json({
      status: 'error',
      message: 'Failed to update book'
    });
  }
};

/**
 * Delete a book (admin only)
 */
export const deleteBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const deleted = await BookModel.delete(id);

    if (!deleted) {
      res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Book deleted successfully'
    });
  } catch (error) {
    log.error('Error deleting book', { error, bookId: req.params.id });
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete book'
    });
  }
};
