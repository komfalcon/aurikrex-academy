import { Request, Response } from 'express';
import { BookModel, BookDifficulty, BookCategoryType, BookFileType } from '../models/Book.model.js';
import { BookReviewModel } from '../models/BookReview.model.js';
import { BookCategoryModel } from '../models/BookCategory.model.js';
import { UserModel } from '../models/User.model.js';
import CoverGenerationService from '../services/CoverGenerationService.js';
import { log } from '../utils/logger.js';
import { sendBookApprovedEmail, sendBookRejectedEmail } from '../utils/email.js';

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

/**
 * Upload a book (student uploads)
 */
export const uploadBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const { 
      title, 
      author, 
      description, 
      category, 
      subject, 
      fileUrl, 
      fileName, 
      fileSize, 
      fileType 
    } = req.body;

    if (!title) {
      res.status(400).json({
        status: 'error',
        message: 'Title is required'
      });
      return;
    }

    // Generate cover
    // NOTE: Currently passing empty buffer because files are uploaded via external URLs.
    // When implementing direct file upload with multer, pass the actual file buffer here
    // to enable PDF cover extraction: req.file.buffer
    const coverResult = await CoverGenerationService.generateCover(
      Buffer.from(''), // TODO: Replace with req.file.buffer when implementing direct file upload
      fileType || 'pdf',
      title
    );

    // Create book record
    const book = await BookModel.create({
      title,
      author: author || 'Unknown',
      description: description || '',
      category: category ? [category] : ['reference'],
      difficulty: 'beginner',
      coverImageUrl: coverResult.url || '',
      pdfUrl: fileUrl,
      fileSize: fileSize || 0,
      pages: 0,
      yearPublished: new Date().getFullYear(),
      relatedCourses: [],
      concepts: [],
      targetAudience: '',
      // Upload workflow fields
      uploadedBy: userId,
      subject: subject || '',
      bookCategory: (category as BookCategoryType) || 'reference',
      fileName: fileName || '',
      fileType: (fileType as BookFileType) || 'pdf',
      coverGenerationStatus: coverResult.status,
      status: 'pending',
    });

    res.status(201).json({
      status: 'success',
      message: 'Book uploaded successfully. Awaiting admin approval.',
      data: {
        id: book._id,
        title: book.title,
        status: book.status,
        coverImageUrl: book.coverImageUrl
      }
    });
  } catch (error) {
    log.error('Error uploading book', { error });
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Upload failed'
    });
  }
};

/**
 * Download book (increment counter)
 */
export const downloadBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookId = req.params.id as string;

    const book = await BookModel.incrementDownloads(bookId);

    if (!book) {
      res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        downloadUrl: book.pdfUrl,
        fileName: book.fileName || book.title
      }
    });
  } catch (error) {
    log.error('Error downloading book', { error, bookId: req.params.id });
    res.status(500).json({
      status: 'error',
      message: 'Failed to process download'
    });
  }
};

/**
 * Add review to book
 */
export const addReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const bookId = req.params.id as string;
    const { rating, reviewText } = req.body;
    
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({
        status: 'error',
        message: 'Rating must be between 1 and 5'
      });
      return;
    }

    // Create review
    const review = await BookReviewModel.create({
      bookId,
      userId,
      rating,
      reviewText
    });

    // Update book average rating
    const ratingStats = await BookReviewModel.getAverageRating(bookId);
    await BookModel.update(bookId, {
      rating: ratingStats.average,
      reviewCount: ratingStats.count
    });

    res.status(201).json({
      status: 'success',
      message: 'Review added successfully',
      data: review
    });
  } catch (error) {
    log.error('Error adding review', { error, bookId: req.params.id });
    res.status(500).json({
      status: 'error',
      message: 'Failed to add review'
    });
  }
};

/**
 * Get reviews for a book
 */
export const getBookReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookId = req.params.id as string;
    const { page = '1', limit = '10' } = req.query;

    const result = await BookReviewModel.findByBook(bookId, {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });

    res.status(200).json({
      status: 'success',
      data: {
        reviews: result.reviews,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      }
    });
  } catch (error) {
    log.error('Error getting book reviews', { error, bookId: req.params.id });
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch reviews'
    });
  }
};

/**
 * Get pending books for approval (admin only)
 */
export const getPendingBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query;

    const result = await BookModel.getPendingBooks({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });

    res.status(200).json({
      status: 'success',
      data: {
        count: result.total,
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
    log.error('Error getting pending books', { error });
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch pending books'
    });
  }
};

/**
 * Approve a book (admin only)
 */
export const approveBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookId = req.params.id as string;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const book = await BookModel.approve(bookId, userId);

    if (!book) {
      res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
      return;
    }

    // Send email notification to the uploader (async, don't block response)
    if (book.uploadedBy) {
      const uploader = await UserModel.findById(book.uploadedBy);
      if (uploader && uploader.email) {
        const firstName = uploader.displayName || uploader.email.split('@')[0];
        sendBookApprovedEmail(uploader.email, firstName, book.title)
          .then(sent => {
            if (sent) {
              log.info('📧 Book approval notification sent', { 
                bookId, 
                uploaderId: book.uploadedBy 
              });
            }
          })
          .catch(err => {
            log.warn('Failed to send book approval email', { 
              error: err instanceof Error ? err.message : String(err),
              bookId,
              uploaderId: book.uploadedBy
            });
          });
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Book approved',
      data: book
    });
  } catch (error) {
    log.error('Error approving book', { error, bookId: req.params.id });
    res.status(500).json({
      status: 'error',
      message: 'Failed to approve book'
    });
  }
};

/**
 * Reject a book (admin only)
 */
export const rejectBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookId = req.params.id as string;
    const userId = req.user?.userId;
    const { reason } = req.body;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const book = await BookModel.reject(bookId, userId, reason);

    if (!book) {
      res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
      return;
    }

    // Send email notification to the uploader (async, don't block response)
    if (book.uploadedBy) {
      const uploader = await UserModel.findById(book.uploadedBy);
      if (uploader && uploader.email) {
        const firstName = uploader.displayName || uploader.email.split('@')[0];
        sendBookRejectedEmail(uploader.email, firstName, book.title, reason)
          .then(sent => {
            if (sent) {
              log.info('📧 Book rejection notification sent', { 
                bookId, 
                uploaderId: book.uploadedBy,
                reason: reason || 'No reason provided'
              });
            }
          })
          .catch(err => {
            log.warn('Failed to send book rejection email', { 
              error: err instanceof Error ? err.message : String(err),
              bookId,
              uploaderId: book.uploadedBy
            });
          });
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Book rejected',
      data: book
    });
  } catch (error) {
    log.error('Error rejecting book', { error, bookId: req.params.id });
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject book'
    });
  }
};

/**
 * Get all categories with icons and colors
 */
export const getCategoriesFormatted = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await BookCategoryModel.getAllFormatted();

    res.status(200).json({
      status: 'success',
      data: categories
    });
  } catch (error) {
    log.error('Error getting formatted categories', { error });
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch categories'
    });
  }
};
