import { AnalyticsModel } from '../models/Analytics.model';
import { log } from '../utils/logger';
import { getErrorMessage } from '../utils/errors';

/**
 * Analytics service for tracking lesson usage and engagement
 */
export class AnalyticsService {
  /**
   * Track a lesson view
   */
  static async trackView(lessonId: string, userId: string): Promise<void> {
    try {
      console.log('📊 Tracking view:', { lessonId, userId });
      
      await AnalyticsModel.trackView(lessonId, userId);
      
      console.log('✅ View tracked successfully');
    } catch (error) {
      log.error('Error tracking analytics view', { error: getErrorMessage(error), lessonId, userId });
      // Don't throw - analytics failures shouldn't break the app
    }
  }

  /**
   * Track lesson completion
   */
  static async trackCompletion(lessonId: string, userId: string, data: {
    timeSpent: number;
    rating?: number;
    struggledSections?: string[];
  }): Promise<void> {
    try {
      console.log('📊 Tracking completion:', { lessonId, userId, data });
      
      await AnalyticsModel.trackCompletion(lessonId, userId, data);
      
      console.log('✅ Completion tracked successfully');
    } catch (error) {
      log.error('Error tracking analytics completion', { error: getErrorMessage(error), lessonId, userId });
      // Don't throw - analytics failures shouldn't break the app
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
      console.log('📊 Tracking exercise:', { lessonId, userId, exerciseId, data });
      
      await AnalyticsModel.trackExercise(lessonId, userId, exerciseId, data);
      
      console.log('✅ Exercise tracked successfully');
    } catch (error) {
      log.error('Error tracking analytics exercise', { error: getErrorMessage(error), lessonId, userId, exerciseId });
      // Don't throw - analytics failures shouldn't break the app
    }
  }

  /**
   * Get lesson analytics
   */
  static async getLessonAnalytics(lessonId: string) {
    try {
      console.log('📊 Getting lesson analytics:', lessonId);
      
      const analytics = await AnalyticsModel.getLessonAnalytics(lessonId);
      
      if (analytics) {
        console.log('✅ Lesson analytics retrieved');
      } else {
        console.log('ℹ️ No analytics found for lesson');
      }
      
      return analytics;
    } catch (error) {
      log.error('Error getting lesson analytics', { error: getErrorMessage(error), lessonId });
      return null;
    }
  }

  /**
   * Get user engagement data
   */
  static async getUserEngagement(userId: string, lessonId: string) {
    try {
      console.log('📊 Getting user engagement:', { userId, lessonId });
      
      const engagement = await AnalyticsModel.getUserEngagement(userId, lessonId);
      
      if (engagement) {
        console.log('✅ User engagement retrieved');
      } else {
        console.log('ℹ️ No engagement found');
      }
      
      return engagement;
    } catch (error) {
      log.error('Error getting user engagement', { error: getErrorMessage(error), userId, lessonId });
      return null;
    }
  }

  /**
   * Get all user engagement data
   */
  static async getAllUserEngagement(userId: string) {
    try {
      console.log('📊 Getting all user engagement:', userId);
      
      const engagements = await AnalyticsModel.getUserAllEngagement(userId);
      
      console.log(`✅ Retrieved ${engagements.length} engagement records`);
      
      return engagements;
    } catch (error) {
      log.error('Error getting all user engagement', { error: getErrorMessage(error), userId });
      return [];
    }
  }
}
