/**
 * User Analytics Controller
 * 
 * Handles user analytics HTTP requests for Aurikrex Academy.
 * Provides endpoints for fetching user-specific analytics data.
 * 
 * All data is derived from the UserActivity collection (single source of truth).
 */

import { Request, Response } from 'express';
import { log } from '../utils/logger.js';
import { UserActivityModel, ExtendedUserAnalyticsResponse } from '../models/UserActivity.model.js';
import { FalkeAIActivityModel } from '../models/FalkeAIActivity.model.js';
import { getDB } from '../config/mongodb.js';

/**
 * GET /api/user/analytics
 * 
 * Get analytics data for the authenticated user.
 * Uses auth middleware to extract userId from JWT/session.
 * Does NOT accept userId from request body or query.
 * 
 * Response:
 * {
 *   totalQuestions: number,
 *   dailyStreak: number,
 *   totalDaysSpent: number,
 *   activityTimeline: { date: string, count: number }[],
 *   dailyBreakdown: { chat: number, login: number, library_view: number, book_upload: number }
 * }
 */
export const getUserAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    log.info('📊 Fetching user analytics', { userId });

    const analytics = await UserActivityModel.getUserAnalytics(userId);

    res.status(200).json({
      status: 'success',
      data: analytics,
    });
  } catch (error) {
    log.error('❌ Error getting user analytics', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId,
    });

    res.status(500).json({
      status: 'error',
      message: 'Failed to get user analytics',
    });
  }
};

/**
 * GET /api/user/analytics/extended
 * 
 * Get extended analytics data including FalkeAI insights and assignment performance.
 */
export const getExtendedAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    log.info('📊 Fetching extended user analytics', { userId });

    // Get base analytics
    const baseAnalytics = await UserActivityModel.getUserAnalytics(userId);

    // Get FalkeAI analytics (if available)
    let falkeAIInsights: ExtendedUserAnalyticsResponse['falkeAIInsights'] = undefined;
    let learningInsights: ExtendedUserAnalyticsResponse['learningInsights'] = undefined;
    let topicsMastered: string[] = [];

    try {
      const falkeAIAnalytics = await FalkeAIActivityModel.getUserAnalytics(userId);
      if (falkeAIAnalytics) {
        falkeAIInsights = {
          focusArea: falkeAIAnalytics.recommendedFocusArea || 'General Learning',
          strengths: falkeAIAnalytics.conceptsMastered.slice(0, 5),
          weaknesses: falkeAIAnalytics.conceptsStruggling.slice(0, 5),
          engagementTrend: falkeAIAnalytics.engagementTrend,
          growthScore: falkeAIAnalytics.growthScore,
          lastUpdated: falkeAIAnalytics.lastUpdated.toISOString(),
        };

        learningInsights = {
          peakLearningTime: falkeAIAnalytics.peakLearningTime,
          averageSessionLength: falkeAIAnalytics.averageSessionDuration,
          lastUpdated: falkeAIAnalytics.lastUpdated.toISOString(),
        };

        topicsMastered = falkeAIAnalytics.conceptsMastered;
      }
    } catch {
      // FalkeAI analytics may not exist, continue without it
      log.info('No FalkeAI analytics found for user', { userId });
    }

    // Get assignment performance
    let assignmentPerformance: ExtendedUserAnalyticsResponse['assignmentPerformance'] = undefined;
    try {
      const db = getDB();
      const assignmentsCol = db.collection('assignments');
      const solutionsCol = db.collection('solutions');

      // Count assignments by status
      const [completed, inProgress, pending, totalSolutions] = await Promise.all([
        assignmentsCol.countDocuments({ studentId: userId, status: { $in: ['submitted', 'graded'] } }),
        assignmentsCol.countDocuments({ studentId: userId, status: { $in: ['analyzed', 'attempted'] } }),
        assignmentsCol.countDocuments({ studentId: userId, status: 'pending' }),
        solutionsCol.find({ studentId: userId }).toArray(),
      ]);

      // Calculate accuracy from solutions
      let accuracy = 0;
      if (totalSolutions.length > 0) {
        const totalAccuracy = totalSolutions.reduce((sum, sol) => {
          const solAccuracy = (sol as { verification?: { accuracy?: number } }).verification?.accuracy;
          return sum + (solAccuracy || 0);
        }, 0);
        accuracy = Math.round(totalAccuracy / totalSolutions.length);
      }

      assignmentPerformance = {
        completed,
        inProgress,
        pending,
        accuracy,
      };
    } catch {
      // Assignment data may not exist, continue without it
      log.info('No assignment data found for user', { userId });
    }

    // Build extended response
    const extendedAnalytics: ExtendedUserAnalyticsResponse = {
      ...baseAnalytics,
      learningInsights,
      assignmentPerformance,
      falkeAIInsights,
      topicsMastered,
    };

    res.status(200).json({
      status: 'success',
      data: extendedAnalytics,
    });
  } catch (error) {
    log.error('❌ Error getting extended user analytics', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId,
    });

    res.status(500).json({
      status: 'error',
      message: 'Failed to get extended analytics',
    });
  }
};
