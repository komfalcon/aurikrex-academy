import { Collection, ObjectId, Filter, UpdateFilter } from 'mongodb';
import { getDB } from '../config/mongodb.js';
import { log } from '../utils/logger.js';
import { Lesson, LessonProgress } from '../types/lesson.types.js';

export interface LessonDocument extends Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'> {
  _id?: ObjectId;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class LessonModel {
  private static collectionName = 'lessons';

  private static getCollection(): Collection<LessonDocument> {
    return getDB().collection<LessonDocument>(this.collectionName);
  }

  /**
   * Create a new lesson
   */
  static async create(lessonData: Omit<LessonDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<LessonDocument> {
    try {
      const collection = this.getCollection();
      const now = new Date();

      const lesson: LessonDocument = {
        ...lessonData,
        createdAt: now,
        updatedAt: now
      };

      const result = await collection.insertOne(lesson);
      
      log.info('✅ Lesson created successfully', { 
        lessonId: result.insertedId,
        title: lessonData.title 
      });

      return { ...lesson, _id: result.insertedId };
    } catch (error) {
      log.error('❌ Error creating lesson', { 
        error: error instanceof Error ? error.message : String(error),
        title: lessonData.title 
      });
      throw error;
    }
  }

  /**
   * Find lesson by ID
   */
  static async findById(lessonId: string | ObjectId): Promise<LessonDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof lessonId === 'string' ? new ObjectId(lessonId) : lessonId;
      
      const lesson = await collection.findOne({ _id });
      
      if (lesson) {
        log.info('✅ Lesson found by ID', { lessonId: _id.toString() });
      }
      
      return lesson;
    } catch (error) {
      log.error('❌ Error finding lesson by ID', { 
        error: error instanceof Error ? error.message : String(error),
        lessonId 
      });
      throw error;
    }
  }

  /**
   * Update lesson
   */
  static async update(
    lessonId: string | ObjectId,
    updateData: Partial<LessonDocument>
  ): Promise<LessonDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof lessonId === 'string' ? new ObjectId(lessonId) : lessonId;

      const update: UpdateFilter<LessonDocument> = {
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
        log.info('✅ Lesson updated successfully', { lessonId: _id.toString() });
      }

      return result || null;
    } catch (error) {
      log.error('❌ Error updating lesson', { 
        error: error instanceof Error ? error.message : String(error),
        lessonId 
      });
      throw error;
    }
  }

  /**
   * Delete lesson
   */
  static async delete(lessonId: string | ObjectId): Promise<boolean> {
    try {
      const collection = this.getCollection();
      const _id = typeof lessonId === 'string' ? new ObjectId(lessonId) : lessonId;

      const result = await collection.deleteOne({ _id });
      
      if (result.deletedCount > 0) {
        log.info('✅ Lesson deleted successfully', { lessonId: _id.toString() });
        return true;
      }
      
      return false;
    } catch (error) {
      log.error('❌ Error deleting lesson', { 
        error: error instanceof Error ? error.message : String(error),
        lessonId 
      });
      throw error;
    }
  }

  /**
   * List lessons with filters and pagination
   */
  static async list(options: {
    page?: number;
    limit?: number;
    authorId?: string;
    status?: LessonDocument['status'];
    subject?: string;
    difficulty?: LessonDocument['difficulty'];
  } = {}): Promise<{
    lessons: LessonDocument[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    try {
      const collection = this.getCollection();
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;

      // Build filter
      const filter: Filter<LessonDocument> = {};
      if (options.authorId) filter.authorId = options.authorId;
      if (options.status) filter.status = options.status;
      if (options.subject) filter.subject = options.subject;
      if (options.difficulty) filter.difficulty = options.difficulty;

      const [lessons, total] = await Promise.all([
        collection
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        collection.countDocuments(filter)
      ]);

      const hasMore = (page * limit) < total;

      log.info('✅ Lessons listed successfully', { 
        page, 
        limit, 
        total,
        returned: lessons.length,
        hasMore
      });

      return { lessons, total, page, limit, hasMore };
    } catch (error) {
      log.error('❌ Error listing lessons', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Search lessons by title or content
   */
  static async search(query: string, options: {
    page?: number;
    limit?: number;
  } = {}): Promise<{
    lessons: LessonDocument[];
    total: number;
  }> {
    try {
      const collection = this.getCollection();
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;

      const filter: Filter<LessonDocument> = {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { subject: { $regex: query, $options: 'i' } },
          { keyConcepts: { $elemMatch: { $regex: query, $options: 'i' } } }
        ]
      };

      const [lessons, total] = await Promise.all([
        collection.find(filter).skip(skip).limit(limit).toArray(),
        collection.countDocuments(filter)
      ]);

      log.info('✅ Lessons searched successfully', { 
        query,
        total,
        returned: lessons.length 
      });

      return { lessons, total };
    } catch (error) {
      log.error('❌ Error searching lessons', { 
        error: error instanceof Error ? error.message : String(error),
        query 
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
        collection.createIndex({ authorId: 1 }),
        collection.createIndex({ status: 1 }),
        collection.createIndex({ subject: 1 }),
        collection.createIndex({ difficulty: 1 }),
        collection.createIndex({ createdAt: -1 }),
        collection.createIndex({ title: 'text', subject: 'text' })
      ]);

      log.info('✅ Lesson indexes created successfully');
    } catch (error) {
      log.error('❌ Error creating lesson indexes', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

// Lesson Progress Model
export interface LessonProgressDocument extends Omit<LessonProgress, 'startedAt' | 'completedAt' | 'lastAccessedAt'> {
  _id?: ObjectId;
  startedAt: Date;
  completedAt: Date | null;
  lastAccessedAt: Date;
}

export class LessonProgressModel {
  private static collectionName = 'lessonProgress';

  private static getCollection(): Collection<LessonProgressDocument> {
    return getDB().collection<LessonProgressDocument>(this.collectionName);
  }

  /**
   * Create or update lesson progress
   */
  static async upsert(
    userId: string,
    lessonId: string,
    progressData: Partial<LessonProgressDocument>
  ): Promise<LessonProgressDocument> {
    try {
      const collection = this.getCollection();
      const now = new Date();

      const progress: Partial<LessonProgressDocument> = {
        userId,
        lessonId,
        lastAccessedAt: now,
        ...progressData
      };

      const result = await collection.findOneAndUpdate(
        { userId, lessonId },
        {
          $set: progress,
          $setOnInsert: {
            startedAt: now,
            status: 'not-started',
            progress: 0,
            timeSpent: 0,
            completedSections: []
          }
        },
        { upsert: true, returnDocument: 'after' }
      );

      log.info('✅ Lesson progress updated', { 
        userId,
        lessonId,
        progress: result?.progress || 0
      });

      return result!;
    } catch (error) {
      log.error('❌ Error updating lesson progress', { 
        error: error instanceof Error ? error.message : String(error),
        userId,
        lessonId
      });
      throw error;
    }
  }

  /**
   * Get lesson progress
   */
  static async get(userId: string, lessonId: string): Promise<LessonProgressDocument | null> {
    try {
      const collection = this.getCollection();
      
      const progress = await collection.findOne({ userId, lessonId });
      
      if (progress) {
        log.info('✅ Lesson progress found', { userId, lessonId });
      }
      
      return progress;
    } catch (error) {
      log.error('❌ Error getting lesson progress', { 
        error: error instanceof Error ? error.message : String(error),
        userId,
        lessonId
      });
      throw error;
    }
  }

  /**
   * List user's lesson progress
   */
  static async listByUser(userId: string): Promise<LessonProgressDocument[]> {
    try {
      const collection = this.getCollection();
      
      const progressList = await collection
        .find({ userId })
        .sort({ lastAccessedAt: -1 })
        .toArray();

      log.info('✅ User lesson progress listed', { 
        userId,
        count: progressList.length 
      });

      return progressList;
    } catch (error) {
      log.error('❌ Error listing user lesson progress', { 
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
        collection.createIndex({ userId: 1, lessonId: 1 }, { unique: true }),
        collection.createIndex({ userId: 1 }),
        collection.createIndex({ lessonId: 1 }),
        collection.createIndex({ status: 1 }),
        collection.createIndex({ lastAccessedAt: -1 })
      ]);

      log.info('✅ Lesson progress indexes created successfully');
    } catch (error) {
      log.error('❌ Error creating lesson progress indexes', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
