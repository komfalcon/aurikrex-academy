import { Collection, ObjectId, Filter } from 'mongodb';
import { getDB } from '../config/mongodb.js';
import { log } from '../utils/logger.js';

export interface BookReviewDocument {
  _id?: ObjectId;
  bookId: ObjectId;
  userId: string;
  rating: number;         // 1-5
  reviewText?: string;
  helpfulVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookReviewListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'rating' | 'helpfulVotes';
  sortOrder?: 'asc' | 'desc';
}

export class BookReviewModel {
  private static collectionName = 'book_reviews';

  private static getCollection(): Collection<BookReviewDocument> {
    return getDB().collection<BookReviewDocument>(this.collectionName);
  }

  /**
   * Create a new review
   */
  static async create(data: {
    bookId: string | ObjectId;
    userId: string;
    rating: number;
    reviewText?: string;
  }): Promise<BookReviewDocument> {
    try {
      const collection = this.getCollection();
      const bookObjectId = typeof data.bookId === 'string' ? new ObjectId(data.bookId) : data.bookId;
      const now = new Date();

      // Check if user already reviewed this book
      const existing = await collection.findOne({
        bookId: bookObjectId,
        userId: data.userId
      });

      if (existing) {
        // Update existing review
        const updated = await this.update(existing._id!.toString(), {
          rating: data.rating,
          reviewText: data.reviewText
        });
        if (updated) return updated;
        throw new Error('Failed to update existing review');
      }

      // Validate rating
      if (data.rating < 1 || data.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const review: BookReviewDocument = {
        bookId: bookObjectId,
        userId: data.userId,
        rating: data.rating,
        reviewText: data.reviewText,
        helpfulVotes: 0,
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(review);
      
      log.info('✅ Book review created successfully', { 
        reviewId: result.insertedId,
        bookId: bookObjectId.toString(),
        userId: data.userId
      });

      return { ...review, _id: result.insertedId };
    } catch (error) {
      log.error('❌ Error creating book review', { 
        error: error instanceof Error ? error.message : String(error),
        bookId: data.bookId,
        userId: data.userId
      });
      throw error;
    }
  }

  /**
   * Find review by ID
   */
  static async findById(reviewId: string | ObjectId): Promise<BookReviewDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof reviewId === 'string' ? new ObjectId(reviewId) : reviewId;
      return await collection.findOne({ _id });
    } catch (error) {
      log.error('❌ Error finding review by ID', { 
        error: error instanceof Error ? error.message : String(error),
        reviewId 
      });
      throw error;
    }
  }

  /**
   * Find reviews for a book
   */
  static async findByBook(
    bookId: string | ObjectId,
    options: BookReviewListOptions = {}
  ): Promise<{ reviews: BookReviewDocument[]; total: number; page: number; limit: number }> {
    try {
      const collection = this.getCollection();
      const bookObjectId = typeof bookId === 'string' ? new ObjectId(bookId) : bookId;
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;

      const filter: Filter<BookReviewDocument> = { bookId: bookObjectId };

      // Sort options
      type SortSpec = { [key: string]: 1 | -1 };
      let sort: SortSpec = { createdAt: -1 };
      
      if (options.sortBy) {
        const order = options.sortOrder === 'asc' ? 1 : -1;
        sort = { [options.sortBy]: order };
      }

      const [reviews, total] = await Promise.all([
        collection.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
        collection.countDocuments(filter)
      ]);

      log.info('✅ Book reviews listed', { 
        bookId: bookObjectId.toString(),
        page, 
        limit, 
        total,
        returned: reviews.length 
      });

      return { reviews, total, page, limit };
    } catch (error) {
      log.error('❌ Error listing book reviews', { 
        error: error instanceof Error ? error.message : String(error),
        bookId
      });
      throw error;
    }
  }

  /**
   * Update a review
   */
  static async update(
    reviewId: string | ObjectId,
    updateData: Partial<Pick<BookReviewDocument, 'rating' | 'reviewText'>>
  ): Promise<BookReviewDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof reviewId === 'string' ? new ObjectId(reviewId) : reviewId;

      if (updateData.rating !== undefined && (updateData.rating < 1 || updateData.rating > 5)) {
        throw new Error('Rating must be between 1 and 5');
      }

      const result = await collection.findOneAndUpdate(
        { _id },
        { $set: { ...updateData, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      if (result) {
        log.info('✅ Review updated successfully', { reviewId: _id.toString() });
      }

      return result || null;
    } catch (error) {
      log.error('❌ Error updating review', { 
        error: error instanceof Error ? error.message : String(error),
        reviewId 
      });
      throw error;
    }
  }

  /**
   * Delete a review
   */
  static async delete(reviewId: string | ObjectId): Promise<boolean> {
    try {
      const collection = this.getCollection();
      const _id = typeof reviewId === 'string' ? new ObjectId(reviewId) : reviewId;

      const result = await collection.deleteOne({ _id });
      
      if (result.deletedCount > 0) {
        log.info('✅ Review deleted successfully', { reviewId: _id.toString() });
        return true;
      }
      
      return false;
    } catch (error) {
      log.error('❌ Error deleting review', { 
        error: error instanceof Error ? error.message : String(error),
        reviewId 
      });
      throw error;
    }
  }

  /**
   * Calculate average rating for a book
   */
  static async getAverageRating(bookId: string | ObjectId): Promise<{ average: number; count: number }> {
    try {
      const collection = this.getCollection();
      const bookObjectId = typeof bookId === 'string' ? new ObjectId(bookId) : bookId;

      const result = await collection.aggregate([
        { $match: { bookId: bookObjectId } },
        { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]).toArray();

      if (result.length === 0) {
        return { average: 0, count: 0 };
      }

      return {
        average: Math.round(result[0].average * 10) / 10,
        count: result[0].count
      };
    } catch (error) {
      log.error('❌ Error calculating average rating', { 
        error: error instanceof Error ? error.message : String(error),
        bookId
      });
      throw error;
    }
  }

  /**
   * Increment helpful votes
   */
  static async incrementHelpfulVotes(reviewId: string | ObjectId): Promise<BookReviewDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof reviewId === 'string' ? new ObjectId(reviewId) : reviewId;

      const result = await collection.findOneAndUpdate(
        { _id },
        { $inc: { helpfulVotes: 1 } },
        { returnDocument: 'after' }
      );

      return result || null;
    } catch (error) {
      log.error('❌ Error incrementing helpful votes', { 
        error: error instanceof Error ? error.message : String(error),
        reviewId 
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
        collection.createIndex({ bookId: 1, userId: 1 }, { unique: true }),
        collection.createIndex({ bookId: 1, createdAt: -1 }),
        collection.createIndex({ userId: 1 }),
        collection.createIndex({ rating: -1 }),
      ]);

      log.info('✅ BookReview indexes created successfully');
    } catch (error) {
      log.error('❌ Error creating BookReview indexes', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
