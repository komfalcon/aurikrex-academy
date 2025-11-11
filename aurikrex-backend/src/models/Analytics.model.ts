import { Collection, ObjectId, Filter } from 'mongodb';
import { getDB } from '../config/mongodb';
import { log } from '../utils/logger';

export interface LessonAnalyticsDocument {
  _id?: ObjectId;
  lessonId: string;
  views: number;
  completions: number;
  averageProgress: number;
  averageTimeSpent: number;
  difficultyRating: number;
  userRatings: number[];
  struggledSections: string[];
  lastUpdated: Date;
}

export interface UserEngagementDocument {
  _id?: ObjectId;
  userId: string;
  lessonId: string;
  startTime: Date;
  endTime?: Date;
  timeSpent: number;
  progress: number;
  interactions: {
    timestamp: Date;
    type: 'view' | 'exercise' | 'resource' | 'quiz';
    data: any;
  }[];
}

export class AnalyticsModel {
  private static analyticsCollection = 'lessonAnalytics';
  private static engagementCollection = 'userEngagement';

  private static getAnalyticsCollection(): Collection<LessonAnalyticsDocument> {
    return getDB().collection<LessonAnalyticsDocument>(this.analyticsCollection);
  }

  private static getEngagementCollection(): Collection<UserEngagementDocument> {
    return getDB().collection<UserEngagementDocument>(this.engagementCollection);
  }

  /**
   * Initialize lesson analytics
   */
  static async initializeLessonAnalytics(lessonId: string): Promise<LessonAnalyticsDocument> {
    try {
      const collection = this.getAnalyticsCollection();
      const now = new Date();

      const analytics: LessonAnalyticsDocument = {
        lessonId,
        views: 0,
        completions: 0,
        averageProgress: 0,
        averageTimeSpent: 0,
        difficultyRating: 0,
        userRatings: [],
        struggledSections: [],
        lastUpdated: now
      };

      await collection.updateOne(
        { lessonId },
        { $setOnInsert: analytics },
        { upsert: true }
      );

      log.info('✅ Lesson analytics initialized', { lessonId });

      return analytics;
    } catch (error) {
      log.error('❌ Error initializing lesson analytics', { 
        error: error instanceof Error ? error.message : String(error),
        lessonId
      });
      throw error;
    }
  }

  /**
   * Track lesson view
   */
  static async trackView(lessonId: string, userId: string): Promise<void> {
    try {
      const analyticsCol = this.getAnalyticsCollection();
      const engagementCol = this.getEngagementCollection();
      const now = new Date();

      // Update analytics
      await analyticsCol.updateOne(
        { lessonId },
        {
          $inc: { views: 1 },
          $set: { lastUpdated: now }
        },
        { upsert: true }
      );

      // Track user engagement
      await engagementCol.updateOne(
        { userId, lessonId },
        {
          $set: {
            userId,
            lessonId,
            lastAccessedAt: now
          },
          $setOnInsert: {
            startTime: now,
            timeSpent: 0,
            progress: 0,
            interactions: []
          },
          $push: {
            interactions: {
              timestamp: now,
              type: 'view' as const,
              data: { action: 'start' }
            }
          }
        },
        { upsert: true }
      );

      log.info('✅ View tracked', { lessonId, userId });
    } catch (error) {
      log.error('❌ Error tracking view', { 
        error: error instanceof Error ? error.message : String(error),
        lessonId,
        userId
      });
      throw error;
    }
  }

  /**
   * Track lesson completion
   */
  static async trackCompletion(
    lessonId: string,
    userId: string,
    data: {
      timeSpent: number;
      rating?: number;
      struggledSections?: string[];
    }
  ): Promise<void> {
    try {
      const analyticsCol = this.getAnalyticsCollection();
      const engagementCol = this.getEngagementCollection();
      const now = new Date();

      // Get current analytics
      const analytics = await analyticsCol.findOne({ lessonId }) || {
        completions: 0,
        averageTimeSpent: 0,
        userRatings: [],
        difficultyRating: 0,
        struggledSections: []
      };

      // Calculate new averages
      const newCompletions = analytics.completions + 1;
      const newAverageTimeSpent = 
        (analytics.averageTimeSpent * analytics.completions + data.timeSpent) / newCompletions;

      const updateData: any = {
        $inc: { completions: 1 },
        $set: {
          averageTimeSpent: newAverageTimeSpent,
          lastUpdated: now
        }
      };

      if (data.rating) {
        const newRatings = [...analytics.userRatings, data.rating];
        const newDifficultyRating = 
          newRatings.reduce((sum, r) => sum + r, 0) / newRatings.length;
        
        updateData.$push = { userRatings: data.rating };
        updateData.$set.difficultyRating = newDifficultyRating;
      }

      if (data.struggledSections && data.struggledSections.length > 0) {
        updateData.$addToSet = { 
          struggledSections: { $each: data.struggledSections } 
        };
      }

      await analyticsCol.updateOne({ lessonId }, updateData, { upsert: true });

      // Update engagement
      await engagementCol.updateOne(
        { userId, lessonId },
        {
          $set: {
            endTime: now,
            timeSpent: data.timeSpent,
            progress: 100
          },
          $push: {
            interactions: {
              timestamp: now,
              type: 'view' as const,
              data: {
                action: 'complete',
                timeSpent: data.timeSpent,
                rating: data.rating,
                struggledSections: data.struggledSections
              }
            }
          }
        }
      );

      log.info('✅ Completion tracked', { lessonId, userId, timeSpent: data.timeSpent });
    } catch (error) {
      log.error('❌ Error tracking completion', { 
        error: error instanceof Error ? error.message : String(error),
        lessonId,
        userId
      });
      throw error;
    }
  }

  /**
   * Track exercise attempt
   */
  static async trackExercise(
    lessonId: string,
    userId: string,
    exerciseId: string,
    data: {
      correct: boolean;
      timeSpent: number;
      attempts: number;
    }
  ): Promise<void> {
    try {
      const engagementCol = this.getEngagementCollection();
      const now = new Date();

      await engagementCol.updateOne(
        { userId, lessonId },
        {
          $push: {
            interactions: {
              timestamp: now,
              type: 'exercise' as const,
              data: {
                exerciseId,
                ...data
              }
            }
          }
        }
      );

      log.info('✅ Exercise attempt tracked', { lessonId, userId, exerciseId, correct: data.correct });
    } catch (error) {
      log.error('❌ Error tracking exercise', { 
        error: error instanceof Error ? error.message : String(error),
        lessonId,
        userId,
        exerciseId
      });
      throw error;
    }
  }

  /**
   * Get lesson analytics
   */
  static async getLessonAnalytics(lessonId: string): Promise<LessonAnalyticsDocument | null> {
    try {
      const collection = this.getAnalyticsCollection();
      const analytics = await collection.findOne({ lessonId });
      
      if (analytics) {
        log.info('✅ Lesson analytics retrieved', { lessonId });
      }
      
      return analytics;
    } catch (error) {
      log.error('❌ Error getting lesson analytics', { 
        error: error instanceof Error ? error.message : String(error),
        lessonId
      });
      throw error;
    }
  }

  /**
   * Get user engagement data
   */
  static async getUserEngagement(userId: string, lessonId: string): Promise<UserEngagementDocument | null> {
    try {
      const collection = this.getEngagementCollection();
      const engagement = await collection.findOne({ userId, lessonId });
      
      if (engagement) {
        log.info('✅ User engagement retrieved', { userId, lessonId });
      }
      
      return engagement;
    } catch (error) {
      log.error('❌ Error getting user engagement', { 
        error: error instanceof Error ? error.message : String(error),
        userId,
        lessonId
      });
      throw error;
    }
  }

  /**
   * Get all analytics for a user
   */
  static async getUserAllEngagement(userId: string): Promise<UserEngagementDocument[]> {
    try {
      const collection = this.getEngagementCollection();
      const engagements = await collection.find({ userId }).toArray();
      
      log.info('✅ User all engagement retrieved', { userId, count: engagements.length });
      
      return engagements;
    } catch (error) {
      log.error('❌ Error getting user all engagement', { 
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
      const analyticsCol = this.getAnalyticsCollection();
      const engagementCol = this.getEngagementCollection();
      
      await Promise.all([
        analyticsCol.createIndex({ lessonId: 1 }, { unique: true }),
        analyticsCol.createIndex({ lastUpdated: -1 }),
        engagementCol.createIndex({ userId: 1, lessonId: 1 }, { unique: true }),
        engagementCol.createIndex({ userId: 1 }),
        engagementCol.createIndex({ lessonId: 1 }),
        engagementCol.createIndex({ startTime: -1 })
      ]);

      log.info('✅ Analytics indexes created successfully');
    } catch (error) {
      log.error('❌ Error creating analytics indexes', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
