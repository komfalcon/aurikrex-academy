import { Collection, ObjectId } from 'mongodb';
import { getDB } from '../config/mongodb.js';
import { log } from '../utils/logger.js';

// Activity types for FalkeAI
export type FalkeAIActivityType = 
  | 'chat_question'
  | 'assignment_upload'
  | 'assignment_analysis'
  | 'solution_upload'
  | 'solution_verification'
  | 'quiz_explanation'
  | 'progress_analysis'
  | 'recommendation'
  | 'concept_explanation'
  | 'performance_review'
  | 'lesson_generation';

// Result types
export type ResultType = 'success' | 'needs_improvement' | 'not_attempted' | 'error';

// FalkeAI activity document
export interface FalkeAIActivityDocument {
  _id?: ObjectId;
  userId: string;
  timestamp: Date;
  
  // Activity Type
  activityType: FalkeAIActivityType;
  
  // Context
  courseId?: string;
  lessonId?: string;
  assignmentId?: string;
  quizId?: string;
  
  // Content
  question?: string;
  questionType?: string;
  responseLength?: number;
  userSatisfaction?: 1 | 2 | 3 | 4 | 5;
  
  // Performance
  timeSpent: number; // seconds
  helpfulRating?: number; // 1-5
  
  // Results
  resultType?: ResultType;
  resultScore?: number; // 0-100
  
  // Additional metadata
  metadata?: Record<string, any>;
}

// User analytics aggregate document
export interface UserAnalyticsDocument {
  _id?: ObjectId;
  userId: string;
  
  // Aggregated Data
  totalActivities: number;
  activitiesByType: Record<FalkeAIActivityType, number>;
  
  // Performance
  averageResponseQuality: number;
  assignmentCompletionRate: number;
  averageSolutionAccuracy: number;
  
  // Learning Patterns
  topicsExplored: string[];
  conceptsMastered: string[];
  conceptsStruggling: string[];
  peakLearningTime: string; // e.g., "8-10 AM"
  averageSessionDuration: number; // minutes
  
  // Time Series
  activityTimeline: {
    date: Date;
    count: number;
    types: Record<string, number>;
  }[];
  
  // Trends
  growthScore: number; // 0-100
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  
  // Predictions
  predictedNextChallenge?: string;
  estimatedMasteryDate?: Date;
  recommendedFocusArea?: string;
  
  lastUpdated: Date;
}

export class FalkeAIActivityModel {
  private static activitiesCollection = 'falkeai_activities';
  private static analyticsCollection = 'user_analytics';

  private static getActivitiesCollection(): Collection<FalkeAIActivityDocument> {
    return getDB().collection<FalkeAIActivityDocument>(this.activitiesCollection);
  }

  private static getAnalyticsCollection(): Collection<UserAnalyticsDocument> {
    return getDB().collection<UserAnalyticsDocument>(this.analyticsCollection);
  }

  /**
   * Track a FalkeAI activity
   */
  static async trackActivity(data: {
    userId: string;
    activityType: FalkeAIActivityType;
    courseId?: string;
    lessonId?: string;
    assignmentId?: string;
    quizId?: string;
    question?: string;
    questionType?: string;
    responseLength?: number;
    timeSpent: number;
    resultType?: ResultType;
    resultScore?: number;
    metadata?: Record<string, any>;
  }): Promise<FalkeAIActivityDocument> {
    try {
      const collection = this.getActivitiesCollection();
      
      const activity: FalkeAIActivityDocument = {
        userId: data.userId,
        timestamp: new Date(),
        activityType: data.activityType,
        courseId: data.courseId,
        lessonId: data.lessonId,
        assignmentId: data.assignmentId,
        quizId: data.quizId,
        question: data.question,
        questionType: data.questionType,
        responseLength: data.responseLength,
        timeSpent: data.timeSpent,
        resultType: data.resultType,
        resultScore: data.resultScore,
        metadata: data.metadata
      };

      const result = await collection.insertOne(activity);
      log.info('✅ FalkeAI activity tracked', { 
        activityId: result.insertedId,
        userId: data.userId,
        type: data.activityType
      });

      // Update user analytics asynchronously
      this.updateUserAnalytics(data.userId).catch(err => {
        log.error('❌ Failed to update user analytics', { error: err.message });
      });

      return { ...activity, _id: result.insertedId };
    } catch (error) {
      log.error('❌ Error tracking FalkeAI activity', {
        error: error instanceof Error ? error.message : String(error),
        userId: data.userId
      });
      throw error;
    }
  }

  /**
   * Get activities for a user
   */
  static async getActivities(
    userId: string,
    options: {
      activityType?: FalkeAIActivityType;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{ activities: FalkeAIActivityDocument[]; total: number }> {
    try {
      const collection = this.getActivitiesCollection();
      const filter: any = { userId };
      
      if (options.activityType) {
        filter.activityType = options.activityType;
      }
      
      if (options.startDate || options.endDate) {
        filter.timestamp = {};
        if (options.startDate) filter.timestamp.$gte = options.startDate;
        if (options.endDate) filter.timestamp.$lte = options.endDate;
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
        collection.countDocuments(filter)
      ]);

      log.info('✅ FalkeAI activities retrieved', { 
        userId, 
        count: activities.length,
        total
      });

      return { activities, total };
    } catch (error) {
      log.error('❌ Error getting FalkeAI activities', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      throw error;
    }
  }

  /**
   * Get user analytics
   */
  static async getUserAnalytics(userId: string): Promise<UserAnalyticsDocument | null> {
    try {
      const collection = this.getAnalyticsCollection();
      const existingAnalytics = await collection.findOne({ userId });
      
      if (!existingAnalytics) {
        // Generate initial analytics
        const newAnalytics = await this.updateUserAnalytics(userId);
        log.info('✅ User analytics generated', { userId });
        return newAnalytics;
      }
      
      log.info('✅ User analytics retrieved', { userId });
      return existingAnalytics;
    } catch (error) {
      log.error('❌ Error getting user analytics', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      throw error;
    }
  }

  /**
   * Update user analytics (aggregation)
   */
  static async updateUserAnalytics(userId: string): Promise<UserAnalyticsDocument> {
    try {
      const activitiesCol = this.getActivitiesCollection();
      const analyticsCol = this.getAnalyticsCollection();
      
      // Get all activities for this user
      const activities = await activitiesCol
        .find({ userId })
        .sort({ timestamp: -1 })
        .toArray();

      // Calculate aggregates
      const totalActivities = activities.length;
      const activitiesByType: Record<string, number> = {};
      const topicsSet = new Set<string>();
      const conceptsMasteredSet = new Set<string>();
      const conceptsStrugglingSet = new Set<string>();
      const hourCounts: Record<number, number> = {};
      let totalResponseQuality = 0;
      let qualityCount = 0;
      let totalSolutionAccuracy = 0;
      let accuracyCount = 0;
      let totalTimeSpent = 0;

      // Process activities
      for (const activity of activities) {
        // Count by type
        const type = activity.activityType;
        activitiesByType[type] = (activitiesByType[type] || 0) + 1;

        // Track topics from metadata
        if (activity.metadata?.topic) {
          topicsSet.add(activity.metadata.topic);
        }

        // Track concepts
        if (activity.metadata?.conceptsMastered) {
          activity.metadata.conceptsMastered.forEach((c: string) => conceptsMasteredSet.add(c));
        }
        if (activity.metadata?.conceptsStruggling) {
          activity.metadata.conceptsStruggling.forEach((c: string) => conceptsStrugglingSet.add(c));
        }

        // Track peak learning time
        const hour = activity.timestamp.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;

        // Track response quality
        if (activity.helpfulRating) {
          totalResponseQuality += activity.helpfulRating * 20; // Convert 1-5 to 0-100
          qualityCount++;
        }

        // Track solution accuracy
        if (activity.resultScore !== undefined && activity.activityType === 'solution_verification') {
          totalSolutionAccuracy += activity.resultScore;
          accuracyCount++;
        }

        // Track time spent
        totalTimeSpent += activity.timeSpent || 0;
      }

      // Find peak learning time
      let peakHour = 0;
      let maxCount = 0;
      for (const [hour, count] of Object.entries(hourCounts)) {
        if (count > maxCount) {
          maxCount = count;
          peakHour = parseInt(hour);
        }
      }
      const peakLearningTime = `${peakHour}:00-${peakHour + 2}:00`;

      // Calculate activity timeline (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activityTimeline: UserAnalyticsDocument['activityTimeline'] = [];
      const dailyActivities: Record<string, { count: number; types: Record<string, number> }> = {};
      
      for (const activity of activities) {
        if (activity.timestamp >= thirtyDaysAgo) {
          const dateKey = activity.timestamp.toISOString().split('T')[0];
          if (!dailyActivities[dateKey]) {
            dailyActivities[dateKey] = { count: 0, types: {} };
          }
          dailyActivities[dateKey].count++;
          dailyActivities[dateKey].types[activity.activityType] = 
            (dailyActivities[dateKey].types[activity.activityType] || 0) + 1;
        }
      }

      for (const [date, data] of Object.entries(dailyActivities)) {
        activityTimeline.push({
          date: new Date(date),
          count: data.count,
          types: data.types
        });
      }
      activityTimeline.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Calculate engagement trend
      let engagementTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (activityTimeline.length >= 7) {
        const recentWeek = activityTimeline.slice(-7);
        const previousWeek = activityTimeline.slice(-14, -7);
        
        const recentAvg = recentWeek.reduce((sum, d) => sum + d.count, 0) / recentWeek.length;
        const previousAvg = previousWeek.length > 0 
          ? previousWeek.reduce((sum, d) => sum + d.count, 0) / previousWeek.length 
          : recentAvg;
        
        if (recentAvg > previousAvg * 1.1) engagementTrend = 'increasing';
        else if (recentAvg < previousAvg * 0.9) engagementTrend = 'decreasing';
      }

      // Calculate growth score (based on recent activity and accuracy improvement)
      const growthScore = Math.min(100, Math.round(
        (totalActivities > 0 ? Math.min(50, totalActivities * 2) : 0) +
        (qualityCount > 0 ? totalResponseQuality / qualityCount / 2 : 0)
      ));

      // Build analytics document
      const analytics: UserAnalyticsDocument = {
        userId,
        totalActivities,
        activitiesByType: activitiesByType as Record<FalkeAIActivityType, number>,
        averageResponseQuality: qualityCount > 0 ? Math.round(totalResponseQuality / qualityCount) : 0,
        assignmentCompletionRate: 0, // This would be calculated from assignment data
        averageSolutionAccuracy: accuracyCount > 0 ? Math.round(totalSolutionAccuracy / accuracyCount) : 0,
        topicsExplored: Array.from(topicsSet),
        conceptsMastered: Array.from(conceptsMasteredSet),
        conceptsStruggling: Array.from(conceptsStrugglingSet),
        peakLearningTime,
        averageSessionDuration: totalActivities > 0 ? Math.round(totalTimeSpent / totalActivities / 60) : 0,
        activityTimeline,
        growthScore,
        engagementTrend,
        lastUpdated: new Date()
      };

      // Upsert the analytics document
      await analyticsCol.updateOne(
        { userId },
        { $set: analytics },
        { upsert: true }
      );

      log.info('✅ User analytics updated', { userId, totalActivities });
      return analytics;
    } catch (error) {
      log.error('❌ Error updating user analytics', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      throw error;
    }
  }

  /**
   * Get activity summary for dashboard
   */
  static async getActivitySummary(userId: string): Promise<{
    totalQuestions: number;
    averageResponseQuality: number;
    topicsMastered: number;
    topicsStruggling: number;
    recentActivity: FalkeAIActivityDocument[];
    activityByDay: { date: string; count: number }[];
  }> {
    try {
      const analytics = await this.getUserAnalytics(userId);
      const { activities } = await this.getActivities(userId, { limit: 10 });

      // Get activity by day for last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const activityByDay = (analytics?.activityTimeline || [])
        .filter(d => d.date >= sevenDaysAgo)
        .map(d => ({
          date: d.date.toISOString().split('T')[0],
          count: d.count
        }));

      return {
        totalQuestions: analytics?.activitiesByType?.chat_question || 0,
        averageResponseQuality: analytics?.averageResponseQuality || 0,
        topicsMastered: analytics?.conceptsMastered?.length || 0,
        topicsStruggling: analytics?.conceptsStruggling?.length || 0,
        recentActivity: activities,
        activityByDay
      };
    } catch (error) {
      log.error('❌ Error getting activity summary', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      throw error;
    }
  }

  /**
   * Rate an activity
   */
  static async rateActivity(
    activityId: string | ObjectId,
    rating: 1 | 2 | 3 | 4 | 5
  ): Promise<FalkeAIActivityDocument | null> {
    try {
      const collection = this.getActivitiesCollection();
      const _id = typeof activityId === 'string' ? new ObjectId(activityId) : activityId;

      const result = await collection.findOneAndUpdate(
        { _id },
        { $set: { helpfulRating: rating } },
        { returnDocument: 'after' }
      );

      if (result) {
        log.info('✅ Activity rated', { activityId: _id.toString(), rating });
        
        // Update analytics
        if (result.userId) {
          this.updateUserAnalytics(result.userId).catch(() => {});
        }
      }

      return result || null;
    } catch (error) {
      log.error('❌ Error rating activity', {
        error: error instanceof Error ? error.message : String(error),
        activityId
      });
      throw error;
    }
  }

  /**
   * Create indexes for optimal performance
   */
  static async createIndexes(): Promise<void> {
    try {
      const activitiesCol = this.getActivitiesCollection();
      const analyticsCol = this.getAnalyticsCollection();
      
      await Promise.all([
        activitiesCol.createIndex({ userId: 1 }),
        activitiesCol.createIndex({ timestamp: -1 }),
        activitiesCol.createIndex({ activityType: 1 }),
        activitiesCol.createIndex({ userId: 1, timestamp: -1 }),
        activitiesCol.createIndex({ userId: 1, activityType: 1 }),
        analyticsCol.createIndex({ userId: 1 }, { unique: true }),
        analyticsCol.createIndex({ lastUpdated: -1 }),
      ]);

      log.info('✅ FalkeAI activity indexes created successfully');
    } catch (error) {
      log.error('❌ Error creating FalkeAI activity indexes', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
