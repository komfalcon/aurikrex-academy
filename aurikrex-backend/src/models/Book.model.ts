import { Collection, ObjectId, Filter, UpdateFilter } from 'mongodb';
import { getDB } from '../config/mongodb.js';
import { log } from '../utils/logger.js';

export type BookDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface BookDocument {
  _id?: ObjectId;
  title: string;
  author: string;
  description: string;
  category: string[];
  difficulty: BookDifficulty;
  coverImageUrl: string;
  pdfUrl: string;
  fileSize: number;      // in MB
  pages: number;
  yearPublished: number;
  rating: number;        // 0-5 (average)
  reviewCount: number;
  
  // Educational metadata
  relatedCourses: ObjectId[];
  concepts: string[];
  targetAudience: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface BookListOptions {
  page?: number;
  limit?: number;
  category?: string;
  difficulty?: BookDifficulty;
  search?: string;
  sortBy?: 'title' | 'rating' | 'newest' | 'popular';
  sortOrder?: 'asc' | 'desc';
}

export class BookModel {
  private static collectionName = 'books';

  private static getCollection(): Collection<BookDocument> {
    return getDB().collection<BookDocument>(this.collectionName);
  }

  /**
   * Create a new book
   */
  static async create(bookData: Omit<BookDocument, '_id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount'>): Promise<BookDocument> {
    try {
      const collection = this.getCollection();
      const now = new Date();

      const book: BookDocument = {
        ...bookData,
        rating: 0,
        reviewCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(book);
      
      log.info('✅ Book created successfully', { 
        bookId: result.insertedId,
        title: bookData.title 
      });

      return { ...book, _id: result.insertedId };
    } catch (error) {
      log.error('❌ Error creating book', { 
        error: error instanceof Error ? error.message : String(error),
        title: bookData.title 
      });
      throw error;
    }
  }

  /**
   * Find book by ID
   */
  static async findById(bookId: string | ObjectId): Promise<BookDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof bookId === 'string' ? new ObjectId(bookId) : bookId;
      
      const book = await collection.findOne({ _id });
      
      if (book) {
        log.info('✅ Book found by ID', { bookId: _id.toString() });
      }
      
      return book;
    } catch (error) {
      log.error('❌ Error finding book by ID', { 
        error: error instanceof Error ? error.message : String(error),
        bookId 
      });
      throw error;
    }
  }

  /**
   * List books with filters and pagination
   */
  static async list(options: BookListOptions = {}): Promise<{ books: BookDocument[]; total: number; page: number; limit: number }> {
    try {
      const collection = this.getCollection();
      const page = options.page || 1;
      const limit = options.limit || 12;
      const skip = (page - 1) * limit;

      const filter: Filter<BookDocument> = {};

      // Category filter
      if (options.category) {
        filter.category = { $in: [options.category] };
      }

      // Difficulty filter
      if (options.difficulty) {
        filter.difficulty = options.difficulty;
      }

      // Search by title or author
      if (options.search) {
        const searchRegex = new RegExp(options.search, 'i');
        filter.$or = [
          { title: { $regex: searchRegex } },
          { author: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
        ];
      }

      // Sort options
      type SortSpec = { [key: string]: 1 | -1 };
      let sort: SortSpec = { createdAt: -1 };
      
      if (options.sortBy) {
        const order = options.sortOrder === 'asc' ? 1 : -1;
        switch (options.sortBy) {
          case 'title':
            sort = { title: order };
            break;
          case 'rating':
            sort = { rating: order };
            break;
          case 'newest':
            sort = { createdAt: order };
            break;
          case 'popular':
            sort = { reviewCount: order };
            break;
        }
      }

      const [books, total] = await Promise.all([
        collection.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
        collection.countDocuments(filter)
      ]);

      log.info('✅ Books listed successfully', { 
        page, 
        limit, 
        total,
        returned: books.length 
      });

      return { books, total, page, limit };
    } catch (error) {
      log.error('❌ Error listing books', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Update book
   */
  static async update(
    bookId: string | ObjectId,
    updateData: Partial<BookDocument>
  ): Promise<BookDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof bookId === 'string' ? new ObjectId(bookId) : bookId;

      const update: UpdateFilter<BookDocument> = {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      };

      const result = await collection.findOneAndUpdate(
        { _id },
        update,
        { returnDocument: 'after' }
      );

      if (result) {
        log.info('✅ Book updated successfully', { bookId: _id.toString() });
      }

      return result || null;
    } catch (error) {
      log.error('❌ Error updating book', { 
        error: error instanceof Error ? error.message : String(error),
        bookId 
      });
      throw error;
    }
  }

  /**
   * Update book rating
   */
  static async updateRating(bookId: string | ObjectId, newRating: number): Promise<BookDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof bookId === 'string' ? new ObjectId(bookId) : bookId;

      const book = await this.findById(_id);
      if (!book) return null;

      // Calculate new average rating
      const totalRating = book.rating * book.reviewCount + newRating;
      const newReviewCount = book.reviewCount + 1;
      const averageRating = totalRating / newReviewCount;

      const result = await collection.findOneAndUpdate(
        { _id },
        {
          $set: {
            rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            reviewCount: newReviewCount,
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );

      if (result) {
        log.info('✅ Book rating updated', { bookId: _id.toString(), newAverage: averageRating });
      }

      return result || null;
    } catch (error) {
      log.error('❌ Error updating book rating', { 
        error: error instanceof Error ? error.message : String(error),
        bookId 
      });
      throw error;
    }
  }

  /**
   * Delete book
   */
  static async delete(bookId: string | ObjectId): Promise<boolean> {
    try {
      const collection = this.getCollection();
      const _id = typeof bookId === 'string' ? new ObjectId(bookId) : bookId;

      const result = await collection.deleteOne({ _id });
      
      if (result.deletedCount > 0) {
        log.info('✅ Book deleted successfully', { bookId: _id.toString() });
        return true;
      }
      
      return false;
    } catch (error) {
      log.error('❌ Error deleting book', { 
        error: error instanceof Error ? error.message : String(error),
        bookId 
      });
      throw error;
    }
  }

  /**
   * Get all unique categories
   */
  static async getCategories(): Promise<string[]> {
    try {
      const collection = this.getCollection();
      const categories = await collection.distinct('category');
      
      log.info('✅ Categories retrieved', { count: categories.length });
      return categories;
    } catch (error) {
      log.error('❌ Error getting categories', { 
        error: error instanceof Error ? error.message : String(error)
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
        collection.createIndex({ title: 'text', author: 'text', description: 'text' }),
        collection.createIndex({ category: 1 }),
        collection.createIndex({ difficulty: 1 }),
        collection.createIndex({ rating: -1 }),
        collection.createIndex({ createdAt: -1 }),
        collection.createIndex({ reviewCount: -1 }),
      ]);

      log.info('✅ Book indexes created successfully');
    } catch (error) {
      log.error('❌ Error creating book indexes', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
