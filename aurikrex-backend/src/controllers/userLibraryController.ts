import { Request, Response } from 'express';
import { UserLibraryModel, ReadingStatus } from '../models/UserLibrary.model.js';
import { BookModel } from '../models/Book.model.js';
import { log } from '../utils/logger.js';
import { UserActivityModel } from '../models/UserActivity.model.js';

/**
 * Get user's library
 */
export const getUserLibrary = async (req: Request, res: Response): Promise<void> => {
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
      page = '1',
      limit = '20',
      status,
      sortBy,
      sortOrder
    } = req.query;

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      status: status as ReadingStatus | undefined,
      sortBy: sortBy as 'lastReadAt' | 'startedAt' | 'progress' | 'personalRating' | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    };

    const result = await UserLibraryModel.listUserLibrary(userId, options);

    // Track library_view event for user analytics (async, don't block response)
    UserActivityModel.create({
      userId,
      type: 'library_view',
      metadata: { page: options.page },
    }).catch(err => log.warn('Failed to track library view activity', { error: err.message }));

    // Fetch book details for each entry
    const entriesWithBooks = await Promise.all(
      result.entries.map(async (entry) => {
        const book = await BookModel.findById(entry.bookId);
        return {
          ...entry,
          book: book || null
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: {
        entries: entriesWithBooks,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      }
    });
  } catch (error) {
    log.error('Error getting user library', { error });
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch library'
    });
  }
};

/**
 * Get currently reading books
 */
export const getCurrentlyReading = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const result = await UserLibraryModel.listUserLibrary(userId, {
      status: 'reading',
      sortBy: 'lastReadAt',
      sortOrder: 'desc',
      limit: 10
    });

    // Fetch book details for each entry
    const entriesWithBooks = await Promise.all(
      result.entries.map(async (entry) => {
        const book = await BookModel.findById(entry.bookId);
        return {
          ...entry,
          book: book || null
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: entriesWithBooks
    });
  } catch (error) {
    log.error('Error getting currently reading', { error });
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch reading list'
    });
  }
};

/**
 * Start reading a book (add to library with 'reading' status)
 */
export const startReading = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const bookId = req.params.bookId as string;
    
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    // Get book to get total pages
    const book = await BookModel.findById(bookId);
    if (!book) {
      res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
      return;
    }

    const entry = await UserLibraryModel.addBook({
      userId,
      bookId,
      status: 'reading',
      totalPages: book.pages
    });

    res.status(201).json({
      status: 'success',
      message: 'Started reading',
      data: {
        ...entry,
        book
      }
    });
  } catch (error) {
    log.error('Error starting reading', { error, bookId: req.params.bookId });
    res.status(500).json({
      status: 'error',
      message: 'Failed to start reading'
    });
  }
};

/**
 * Add book to want-to-read list
 */
export const addToWantToRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const bookId = req.params.bookId as string;
    
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    // Get book to get total pages
    const book = await BookModel.findById(bookId);
    if (!book) {
      res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
      return;
    }

    const entry = await UserLibraryModel.addBook({
      userId,
      bookId,
      status: 'want-to-read',
      totalPages: book.pages
    });

    res.status(201).json({
      status: 'success',
      message: 'Added to reading list',
      data: {
        ...entry,
        book
      }
    });
  } catch (error) {
    log.error('Error adding to want-to-read', { error, bookId: req.params.bookId });
    res.status(500).json({
      status: 'error',
      message: 'Failed to add to reading list'
    });
  }
};

/**
 * Update reading progress
 */
export const updateProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const bookId = req.params.bookId as string;
    const { currentPage } = req.body;
    
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    if (typeof currentPage !== 'number' || currentPage < 0) {
      res.status(400).json({
        status: 'error',
        message: 'Valid currentPage is required'
      });
      return;
    }

    const entry = await UserLibraryModel.updateProgress(userId, bookId, currentPage);

    if (!entry) {
      res.status(404).json({
        status: 'error',
        message: 'Book not in library'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Progress updated',
      data: entry
    });
  } catch (error) {
    log.error('Error updating progress', { error, bookId: req.params.bookId });
    res.status(500).json({
      status: 'error',
      message: 'Failed to update progress'
    });
  }
};

/**
 * Mark book as complete
 */
export const markComplete = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const bookId = req.params.bookId as string;
    
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const entry = await UserLibraryModel.updateStatus(userId, bookId, 'completed');

    if (!entry) {
      res.status(404).json({
        status: 'error',
        message: 'Book not in library'
      });
      return;
    }

    // Update book rating if personal rating exists
    if (entry.personalRating) {
      await BookModel.updateRating(bookId, entry.personalRating);
    }

    res.status(200).json({
      status: 'success',
      message: 'Marked as complete',
      data: entry
    });
  } catch (error) {
    log.error('Error marking complete', { error, bookId: req.params.bookId });
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark as complete'
    });
  }
};

/**
 * Update book status (want-to-read, reading, completed)
 */
export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const bookId = req.params.bookId as string;
    const { status } = req.body;
    
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const validStatuses: ReadingStatus[] = ['want-to-read', 'reading', 'completed'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be: want-to-read, reading, or completed'
      });
      return;
    }

    const entry = await UserLibraryModel.updateStatus(userId, bookId, status);

    if (!entry) {
      res.status(404).json({
        status: 'error',
        message: 'Book not in library'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Status updated',
      data: entry
    });
  } catch (error) {
    log.error('Error updating status', { error, bookId: req.params.bookId });
    res.status(500).json({
      status: 'error',
      message: 'Failed to update status'
    });
  }
};

/**
 * Rate a book
 */
export const rateBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const bookId = req.params.bookId as string;
    const { rating } = req.body;
    
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      res.status(400).json({
        status: 'error',
        message: 'Rating must be between 1 and 5'
      });
      return;
    }

    const entry = await UserLibraryModel.updateRating(userId, bookId, rating);

    if (!entry) {
      res.status(404).json({
        status: 'error',
        message: 'Book not in library'
      });
      return;
    }

    // Update the book's overall rating
    await BookModel.updateRating(bookId, rating);

    res.status(200).json({
      status: 'success',
      message: 'Rating updated',
      data: entry
    });
  } catch (error) {
    log.error('Error rating book', { error, bookId: req.params.bookId });
    res.status(500).json({
      status: 'error',
      message: 'Failed to rate book'
    });
  }
};

/**
 * Update notes for a book
 */
export const updateNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const bookId = req.params.bookId as string;
    const { notes } = req.body;
    
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    if (typeof notes !== 'string') {
      res.status(400).json({
        status: 'error',
        message: 'Notes must be a string'
      });
      return;
    }

    const entry = await UserLibraryModel.updateNotes(userId, bookId, notes);

    if (!entry) {
      res.status(404).json({
        status: 'error',
        message: 'Book not in library'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Notes updated',
      data: entry
    });
  } catch (error) {
    log.error('Error updating notes', { error, bookId: req.params.bookId });
    res.status(500).json({
      status: 'error',
      message: 'Failed to update notes'
    });
  }
};

/**
 * Remove book from library
 */
export const removeFromLibrary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const bookId = req.params.bookId as string;
    
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const removed = await UserLibraryModel.removeBook(userId, bookId);

    if (!removed) {
      res.status(404).json({
        status: 'error',
        message: 'Book not in library'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Book removed from library'
    });
  } catch (error) {
    log.error('Error removing from library', { error, bookId: req.params.bookId });
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove book'
    });
  }
};

/**
 * Get user's reading stats
 */
export const getReadingStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const stats = await UserLibraryModel.getUserStats(userId);

    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    log.error('Error getting reading stats', { error });
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch reading stats'
    });
  }
};

/**
 * Check if book is in user's library
 */
export const checkBookInLibrary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const bookId = req.params.bookId as string;
    
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const entry = await UserLibraryModel.findByUserAndBook(userId, bookId);

    res.status(200).json({
      status: 'success',
      data: {
        inLibrary: !!entry,
        entry: entry || null
      }
    });
  } catch (error) {
    log.error('Error checking library', { error, bookId: req.params.bookId });
    res.status(500).json({
      status: 'error',
      message: 'Failed to check library'
    });
  }
};
