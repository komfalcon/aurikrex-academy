import { Collection, ObjectId } from 'mongodb';
import { getDB } from '../config/mongodb.js';
import { log } from '../utils/logger.js';

/**
 * User Activity Types for Phase 1
 */
export type UserActivityType = 'chat' | 'login' | 'library_view' | 'book_upload';

/**
 * User Activity Document Schema
 * Single source of truth for user activity tracking
 */
export interface UserActivityDocument {
  _id?: ObjectId;
  userId: ObjectId;
  type: UserActivityType;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Activity Timeline Entry
 */
export interface ActivityTimelineEntry {
  date: string; // YYYY-MM-DD format
  count: number;
}

/**
 * Daily Breakdown by activity type
 */
export interface DailyBreakdown {
  chat: number;
  login: number;
  library_view: number;
  book_upload: number;
}

/**
 * User Analytics Response
 */
export interface UserAnalyticsResponse {
  totalQuestions: number;
  dailyStreak: number;
  totalDaysSpent: number;
  activityTimeline: ActivityTimelineEntry[];
  dailyBreakdown: DailyBreakdown;
}

/**
 * UserActivity Model
 * Event-driven activity tracking for user analytics
 */
export class UserActivityModel {
  private static collectionName = 'UserActivity';

  private static getCollection(): Collection<UserActivityDocument> {
    return getDB().collection<UserActivityDocument>(this.collectionName);
  }

  /**
   * Create a new activity event
   */
  static async create(data: {
    userId: string | ObjectId;
    type: UserActivityType;
    metadata?: Record<string, unknown>;
  }): Promise<UserActivityDocument> {
    try {
      const collection = this.getCollection();
      const _userId = typeof data.userId === 'string' ? new ObjectId(data.userId) : data.userId;

      const activity: UserActivityDocument = {
        userId: _userId,
        type: data.type,
        timestamp: new Date(),
        metadata: data.metadata,
      };

      const result = await collection.insertOne(activity);

      log.info('✅ UserActivity event created', {
        activityId: result.insertedId,
        userId: _userId.toString(),
        type: data.type,
      });

      return { ...activity, _id: result.insertedId };
    } catch (error) {
      log.error('❌ Error creating UserActivity event', {
        error: error instanceof Error ? error.message : String(error),
        userId: data.userId,
        type: data.type,
      });
      throw error;
    }
  }

  /**
   * Get user analytics
   * Returns aggregated metrics based on UserActivity collection
   */
  static async getUserAnalytics(userId: string | ObjectId): Promise<UserAnalyticsResponse> {
    try {
      const collection = this.getCollection();
      const _userId = typeof userId === 'string' ? new ObjectId(userId) : userId;

      // Get all activities for this user
      const activities = await collection
        .find({ userId: _userId })
        .sort({ timestamp: -1 })
        .toArray();

      // Calculate totalQuestions (count of 'chat' events)
      const totalQuestions = activities.filter(a => a.type === 'chat').length;

      // Calculate distinct activity dates
      const activityDatesSet = new Set<string>();
      activities.forEach(a => {
        const dateStr = a.timestamp.toISOString().split('T')[0];
        activityDatesSet.add(dateStr);
      });
      const totalDaysSpent = activityDatesSet.size;

      // Calculate daily streak
      const dailyStreak = this.calculateDailyStreak(activityDatesSet);

      // Calculate activity timeline
      const activityTimeline = this.calculateActivityTimeline(activities);

      // Calculate daily breakdown for today
      const dailyBreakdown = this.calculateDailyBreakdown(activities);

      log.info('✅ User analytics retrieved', {
        userId: _userId.toString(),
        totalQuestions,
        dailyStreak,
        totalDaysSpent,
      });

      return {
        totalQuestions,
        dailyStreak,
        totalDaysSpent,
        activityTimeline,
        dailyBreakdown,
      };
    } catch (error) {
      log.error('❌ Error getting user analytics', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Calculate daily streak
   * Algorithm:
   * - Sort distinct activity dates descending
   * - If today has activity, check if yesterday also had activity
   * - Continue backward until a gap appears
   * - If no activity today, streak = 0
   */
  private static calculateDailyStreak(activityDatesSet: Set<string>): number {
    if (activityDatesSet.size === 0) {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // If no activity today, streak is 0
    if (!activityDatesSet.has(todayStr)) {
      return 0;
    }

    // Sort dates descending
    const sortedDates = Array.from(activityDatesSet).sort((a, b) => b.localeCompare(a));

    let streak = 0;
    let currentDate = new Date(today);

    for (const dateStr of sortedDates) {
      const currentDateStr = currentDate.toISOString().split('T')[0];
      
      if (dateStr === currentDateStr) {
        streak++;
        // Move to previous day
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (dateStr < currentDateStr) {
        // Gap found, break the streak
        break;
      }
    }

    return streak;
  }

  /**
   * Calculate activity timeline
   * Returns activity grouped by date with counts
   */
  private static calculateActivityTimeline(activities: UserActivityDocument[]): ActivityTimelineEntry[] {
    const dateCountMap = new Map<string, number>();

    activities.forEach(a => {
      const dateStr = a.timestamp.toISOString().split('T')[0];
      dateCountMap.set(dateStr, (dateCountMap.get(dateStr) || 0) + 1);
    });

    // Convert to array and sort by date ascending
    return Array.from(dateCountMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate daily breakdown for today
   * Returns count by type for the current day
   */
  private static calculateDailyBreakdown(activities: UserActivityDocument[]): DailyBreakdown {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const breakdown: DailyBreakdown = {
      chat: 0,
      login: 0,
      library_view: 0,
      book_upload: 0,
    };

    activities.forEach(a => {
      const dateStr = a.timestamp.toISOString().split('T')[0];
      if (dateStr === todayStr) {
        breakdown[a.type]++;
      }
    });

    return breakdown;
  }

  /**
   * Get activities for a user with pagination
   */
  static async getActivities(
    userId: string | ObjectId,
    options: {
      type?: UserActivityType;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{ activities: UserActivityDocument[]; total: number }> {
    try {
      const collection = this.getCollection();
      const _userId = typeof userId === 'string' ? new ObjectId(userId) : userId;

      const filter: Record<string, unknown> = { userId: _userId };

      if (options.type) {
        filter.type = options.type;
      }

      if (options.startDate || options.endDate) {
        filter.timestamp = {};
        if (options.startDate) (filter.timestamp as Record<string, Date>).$gte = options.startDate;
        if (options.endDate) (filter.timestamp as Record<string, Date>).$lte = options.endDate;
      }

      const limit = options.limit || 50;
      const skip = options.skip || 0;

      const [activities, total] = await Promise.all([
        collection
          .find(filter)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        collection.countDocuments(filter),
      ]);

      return { activities, total };
    } catch (error) {
      log.error('❌ Error getting activities', {
        error: error instanceof Error ? error.message : String(error),
        userId,
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
        // Primary index for user queries with timestamp sorting
        collection.createIndex({ userId: 1, timestamp: -1 }),
        // Index for filtering by type
        collection.createIndex({ userId: 1, type: 1 }),
        // Index for timestamp queries
        collection.createIndex({ timestamp: -1 }),
      ]);

      log.info('✅ UserActivity indexes created successfully');
    } catch (error) {
      log.error('❌ Error creating UserActivity indexes', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
