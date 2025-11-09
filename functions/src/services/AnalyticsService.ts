import { db } from '../config/firebase';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { log } from '../utils/logger';

interface LessonAnalytics {
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

interface UserEngagement {
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

/**
 * Analytics service for tracking lesson usage and engagement
 */
export class AnalyticsService {
  private static readonly analyticsCollection = 'lessonAnalytics';
  private static readonly engagementCollection = 'userEngagement';

  /**
   * Track a lesson view
   */
  static async trackView(lessonId: string, userId: string): Promise<void> {
    try {
      const now = new Date();
      const analyticsRef = db.collection(this.analyticsCollection).doc(lessonId);
      const engagementRef = db.collection(this.engagementCollection)
        .doc(`${userId}_${lessonId}`);

      await db.runTransaction(async (transaction) => {
        const analyticsDoc = await transaction.get(analyticsRef);
        const engagementDoc = await transaction.get(engagementRef);

        if (!analyticsDoc.exists) {
          transaction.set(analyticsRef, {
            lessonId,
            views: 1,
            completions: 0,
            averageProgress: 0,
            averageTimeSpent: 0,
            difficultyRating: 0,
            userRatings: [],
            struggledSections: [],
            lastUpdated: Timestamp.fromDate(now)
          });
        } else {
          transaction.update(analyticsRef, {
            views: analyticsDoc.data()!.views + 1,
            lastUpdated: Timestamp.fromDate(now)
          });
        }

        if (!engagementDoc.exists) {
          transaction.set(engagementRef, {
            userId,
            lessonId,
            startTime: Timestamp.fromDate(now),
            timeSpent: 0,
            progress: 0,
            interactions: [{
              timestamp: Timestamp.fromDate(now),
              type: 'view',
              data: { action: 'start' }
            }]
          });
        } else {
          transaction.update(engagementRef, {
            'interactions': [...engagementDoc.data()!.interactions, {
              timestamp: Timestamp.fromDate(now),
              type: 'view',
              data: { action: 'resume' }
            }]
          });
        }
      });

      log.info('Analytics tracked view', { lessonId, userId });
    } catch (error) {
      log.error('Error tracking analytics view', { error, lessonId, userId });
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
      const now = new Date();
      const analyticsRef = db.collection(this.analyticsCollection).doc(lessonId);
      const engagementRef = db.collection(this.engagementCollection)
        .doc(`${userId}_${lessonId}`);

      await db.runTransaction(async (transaction) => {
        const analyticsDoc = await transaction.get(analyticsRef);
        const engagementDoc = await transaction.get(engagementRef);

        if (analyticsDoc.exists) {
          const analytics = analyticsDoc.data() as LessonAnalytics;
          
          // Update analytics
          transaction.update(analyticsRef, {
            completions: analytics.completions + 1,
            averageTimeSpent: (
              (analytics.averageTimeSpent * analytics.completions + data.timeSpent) / 
              (analytics.completions + 1)
            ),
            ...(data.rating ? {
              userRatings: [...analytics.userRatings, data.rating],
              difficultyRating: (
                (analytics.difficultyRating * analytics.userRatings.length + data.rating) /
                (analytics.userRatings.length + 1)
              )
            } : {}),
            ...(data.struggledSections ? {
              struggledSections: [
                ...new Set([...analytics.struggledSections, ...data.struggledSections])
              ]
            } : {}),
            lastUpdated: Timestamp.fromDate(now)
          });
        }

        if (engagementDoc.exists) {
          transaction.update(engagementRef, {
            endTime: Timestamp.fromDate(now),
            timeSpent: data.timeSpent,
            progress: 100,
            interactions: [...engagementDoc.data()!.interactions, {
              timestamp: Timestamp.fromDate(now),
              type: 'view',
              data: { 
                action: 'complete',
                timeSpent: data.timeSpent,
                rating: data.rating,
                struggledSections: data.struggledSections
              }
            }]
          });
        }
      });

      log.info('Analytics tracked completion', { lessonId, userId, data });
    } catch (error) {
      log.error('Error tracking analytics completion', { error, lessonId, userId });
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
      const now = new Date();
      const engagementRef = db.collection(this.engagementCollection)
        .doc(`${userId}_${lessonId}`);

      await engagementRef.update({
        interactions: FieldValue.arrayUnion({
          timestamp: Timestamp.fromDate(now),
          type: 'exercise',
          data: {
            exerciseId,
            ...data
          }
        })
      });

      log.info('Analytics tracked exercise', { lessonId, userId, exerciseId, data });
    } catch (error) {
      log.error('Error tracking analytics exercise', { error, lessonId, userId, exerciseId });
    }
  }

  /**
   * Get lesson analytics
   */
  static async getLessonAnalytics(lessonId: string): Promise<LessonAnalytics | null> {
    try {
      const doc = await db.collection(this.analyticsCollection).doc(lessonId).get();
      return doc.exists ? (doc.data() as LessonAnalytics) : null;
    } catch (error) {
      log.error('Error getting lesson analytics', { error, lessonId });
      return null;
    }
  }

  /**
   * Get user engagement data
   */
  static async getUserEngagement(userId: string, lessonId: string): Promise<UserEngagement | null> {
    try {
      const doc = await db.collection(this.engagementCollection)
        .doc(`${userId}_${lessonId}`)
        .get();
      return doc.exists ? (doc.data() as UserEngagement) : null;
    } catch (error) {
      log.error('Error getting user engagement', { error, userId, lessonId });
      return null;
    }
  }
}