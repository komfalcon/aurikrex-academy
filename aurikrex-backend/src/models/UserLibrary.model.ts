import { Collection, ObjectId, Filter } from 'mongodb';
import { getDB } from '../config/mongodb.js';
import { log } from '../utils/logger.js';

export type ReadingStatus = 'want-to-read' | 'reading' | 'completed';

export interface HighlightedSection {
  page: number;
  text: string;
  note: string;
}

export interface UserLibraryDocument {
  _id?: ObjectId;
  userId: string;
  bookId: ObjectId;
  
  // Status
  status: ReadingStatus;
  
  // Progress
  progress: number;           // 0-100%
  currentPage: number;
  totalPages: number;
  
  // Activity
  startedAt: Date;
  completedAt?: Date;
  lastReadAt: Date;
  
  // Notes
  personalRating?: number;    // User's personal rating (1-5)
  notes?: string;
  highlightedSections?: HighlightedSection[];
}

export interface UserLibraryListOptions {
  page?: number;
  limit?: number;
  status?: ReadingStatus;
  sortBy?: 'lastReadAt' | 'startedAt' | 'progress' | 'personalRating';
  sortOrder?: 'asc' | 'desc';
}

export class UserLibraryModel {
  private static collectionName = 'user_library';

  private static getCollection(): Collection<UserLibraryDocument> {
    return getDB().collection<UserLibraryDocument>(this.collectionName);
  }

  /**
   * Add book to user's library (start reading or want to read)
   */
  static async addBook(data: {
    userId: string;
    bookId: string | ObjectId;
    status: ReadingStatus;
    totalPages: number;
  }): Promise<UserLibraryDocument> {
    try {
      const collection = this.getCollection();
      const bookObjectId = typeof data.bookId === 'string' ? new ObjectId(data.bookId) : data.bookId;
      const now = new Date();

      // Check if book already in user's library
      const existing = await collection.findOne({
        userId: data.userId,
        bookId: bookObjectId
      });

      if (existing) {
        // Update status instead of creating duplicate
        const updated = await this.updateStatus(data.userId, data.bookId, data.status);
        if (updated) return updated;
        throw new Error('Failed to update existing library entry');
      }

      const libraryEntry: UserLibraryDocument = {
        userId: data.userId,
        bookId: bookObjectId,
        status: data.status,
        progress: 0,
        currentPage: 0,
        totalPages: data.totalPages,
        startedAt: data.status === 'reading' ? now : now,
        lastReadAt: now,
      };

      const result = await collection.insertOne(libraryEntry);
      
      log.info('✅ Book added to user library', { 
        userId: data.userId,
        bookId: bookObjectId.toString(),
        status: data.status
      });

      return { ...libraryEntry, _id: result.insertedId };
    } catch (error) {
      log.error('❌ Error adding book to library', { 
        error: error instanceof Error ? error.message : String(error),
        userId: data.userId,
        bookId: data.bookId 
      });
      throw error;
    }
  }

  /**
   * Get user's library entry for a specific book
   */
  static async findByUserAndBook(userId: string, bookId: string | ObjectId): Promise<UserLibraryDocument | null> {
    try {
      const collection = this.getCollection();
      const bookObjectId = typeof bookId === 'string' ? new ObjectId(bookId) : bookId;
      
      const entry = await collection.findOne({
        userId,
        bookId: bookObjectId
      });
      
      return entry;
    } catch (error) {
      log.error('❌ Error finding library entry', { 
        error: error instanceof Error ? error.message : String(error),
        userId,
        bookId 
      });
      throw error;
    }
  }

  /**
   * List user's library with filters
   */
  static async listUserLibrary(
    userId: string,
    options: UserLibraryListOptions = {}
  ): Promise<{ entries: UserLibraryDocument[]; total: number; page: number; limit: number }> {
    try {
      const collection = this.getCollection();
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;

      const filter: Filter<UserLibraryDocument> = { userId };

      if (options.status) {
        filter.status = options.status;
      }

      // Sort options
      type SortSpec = { [key: string]: 1 | -1 };
      let sort: SortSpec = { lastReadAt: -1 };
      
      if (options.sortBy) {
        const order = options.sortOrder === 'asc' ? 1 : -1;
        sort = { [options.sortBy]: order };
      }

      const [entries, total] = await Promise.all([
        collection.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
        collection.countDocuments(filter)
      ]);

      log.info('✅ User library listed', { 
        userId,
        page, 
        limit, 
        total,
        returned: entries.length 
      });

      return { entries, total, page, limit };
    } catch (error) {
      log.error('❌ Error listing user library', { 
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      throw error;
    }
  }

  /**
   * Update reading progress
   */
  static async updateProgress(
    userId: string,
    bookId: string | ObjectId,
    currentPage: number
  ): Promise<UserLibraryDocument | null> {
    try {
      const collection = this.getCollection();
      const bookObjectId = typeof bookId === 'string' ? new ObjectId(bookId) : bookId;

      const entry = await this.findByUserAndBook(userId, bookObjectId);
      if (!entry) return null;

      const progress = Math.min(100, Math.round((currentPage / entry.totalPages) * 100));
      const now = new Date();

      const updateData: Partial<UserLibraryDocument> = {
        currentPage,
        progress,
        lastReadAt: now,
      };

      // Auto-update status based on progress
      if (progress === 0 && entry.status !== 'want-to-read') {
        updateData.status = 'reading';
      } else if (progress > 0 && progress < 100 && entry.status !== 'reading') {
        updateData.status = 'reading';
      } else if (progress >= 100 && entry.status !== 'completed') {
        updateData.status = 'completed';
        updateData.completedAt = now;
      }

      const result = await collection.findOneAndUpdate(
        { userId, bookId: bookObjectId },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (result) {
        log.info('✅ Reading progress updated', { 
          userId, 
          bookId: bookObjectId.toString(),
          progress 
        });
      }

      return result || null;
    } catch (error) {
      log.error('❌ Error updating progress', { 
        error: error instanceof Error ? error.message : String(error),
        userId,
        bookId 
      });
      throw error;
    }
  }

  /**
   * Update reading status
   */
  static async updateStatus(
    userId: string,
    bookId: string | ObjectId,
    status: ReadingStatus
  ): Promise<UserLibraryDocument | null> {
    try {
      const collection = this.getCollection();
      const bookObjectId = typeof bookId === 'string' ? new ObjectId(bookId) : bookId;
      const now = new Date();

      const updateData: Partial<UserLibraryDocument> = {
        status,
        lastReadAt: now,
      };

      if (status === 'completed') {
        updateData.completedAt = now;
        updateData.progress = 100;
      } else if (status === 'reading') {
        // If switching back to reading from completed, remove completedAt
        updateData.completedAt = undefined;
      }

      const result = await collection.findOneAndUpdate(
        { userId, bookId: bookObjectId },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (result) {
        log.info('✅ Reading status updated', { 
          userId, 
          bookId: bookObjectId.toString(),
          status 
        });
      }

      return result || null;
    } catch (error) {
      log.error('❌ Error updating status', { 
        error: error instanceof Error ? error.message : String(error),
        userId,
        bookId 
      });
      throw error;
    }
  }

  /**
   * Add/update personal rating
   */
  static async updateRating(
    userId: string,
    bookId: string | ObjectId,
    rating: number
  ): Promise<UserLibraryDocument | null> {
    try {
      const collection = this.getCollection();
      const bookObjectId = typeof bookId === 'string' ? new ObjectId(bookId) : bookId;

      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const result = await collection.findOneAndUpdate(
        { userId, bookId: bookObjectId },
        { $set: { personalRating: rating, lastReadAt: new Date() } },
        { returnDocument: 'after' }
      );

      if (result) {
        log.info('✅ Personal rating updated', { 
          userId, 
          bookId: bookObjectId.toString(),
          rating 
        });
      }

      return result || null;
    } catch (error) {
      log.error('❌ Error updating rating', { 
        error: error instanceof Error ? error.message : String(error),
        userId,
        bookId 
      });
      throw error;
    }
  }

  /**
   * Add/update notes
   */
  static async updateNotes(
    userId: string,
    bookId: string | ObjectId,
    notes: string
  ): Promise<UserLibraryDocument | null> {
    try {
      const collection = this.getCollection();
      const bookObjectId = typeof bookId === 'string' ? new ObjectId(bookId) : bookId;

      const result = await collection.findOneAndUpdate(
        { userId, bookId: bookObjectId },
        { $set: { notes, lastReadAt: new Date() } },
        { returnDocument: 'after' }
      );

      if (result) {
        log.info('✅ Notes updated', { 
          userId, 
          bookId: bookObjectId.toString()
        });
      }

      return result || null;
    } catch (error) {
      log.error('❌ Error updating notes', { 
        error: error instanceof Error ? error.message : String(error),
        userId,
        bookId 
      });
      throw error;
    }
  }

  /**
   * Remove book from user's library
   */
  static async removeBook(userId: string, bookId: string | ObjectId): Promise<boolean> {
    try {
      const collection = this.getCollection();
      const bookObjectId = typeof bookId === 'string' ? new ObjectId(bookId) : bookId;

      const result = await collection.deleteOne({
        userId,
        bookId: bookObjectId
      });
      
      if (result.deletedCount > 0) {
        log.info('✅ Book removed from library', { 
          userId, 
          bookId: bookObjectId.toString() 
        });
        return true;
      }
      
      return false;
    } catch (error) {
      log.error('❌ Error removing book from library', { 
        error: error instanceof Error ? error.message : String(error),
        userId,
        bookId 
      });
      throw error;
    }
  }

  /**
   * Get reading statistics for a user
   */
  static async getUserStats(userId: string): Promise<{
    totalBooks: number;
    reading: number;
    completed: number;
    wantToRead: number;
    totalPagesRead: number;
  }> {
    try {
      const collection = this.getCollection();

      const [reading, completed, wantToRead, totalPagesResult] = await Promise.all([
        collection.countDocuments({ userId, status: 'reading' }),
        collection.countDocuments({ userId, status: 'completed' }),
        collection.countDocuments({ userId, status: 'want-to-read' }),
        collection.aggregate([
          { $match: { userId } },
          { $group: { _id: null, totalPages: { $sum: '$currentPage' } } }
        ]).toArray()
      ]);

      const totalPagesRead = totalPagesResult[0]?.totalPages || 0;

      return {
        totalBooks: reading + completed + wantToRead,
        reading,
        completed,
        wantToRead,
        totalPagesRead
      };
    } catch (error) {
      log.error('❌ Error getting user stats', { 
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      throw error;
    }
  }

  /**
   * Create indexes for optimal performance
   */
  static async createIndexes(): Promise<void> {
    try {
      const collection = this.getCollection();
      
      await Promise.all([
        collection.createIndex({ userId: 1, bookId: 1 }, { unique: true }),
        collection.createIndex({ userId: 1, status: 1 }),
        collection.createIndex({ userId: 1, lastReadAt: -1 }),
        collection.createIndex({ bookId: 1 }),
      ]);

      log.info('✅ UserLibrary indexes created successfully');
    } catch (error) {
      log.error('❌ Error creating UserLibrary indexes', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
