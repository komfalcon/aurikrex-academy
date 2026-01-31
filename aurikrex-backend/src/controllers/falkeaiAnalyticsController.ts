/**
 * FalkeAI Analytics Controller
 * 
 * Handles analytics-related HTTP requests for Aurikrex Academy.
 * Provides endpoints for tracking activities and retrieving user analytics.
 */

import { Request, Response } from 'express';
import { log } from '../utils/logger.js';
import { FalkeAIActivityModel, FalkeAIActivityType } from '../models/FalkeAIActivity.model.js';

// Helper to extract string from params
const getParamId = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

/**
 * POST /api/analytics/track
 * Track a FalkeAI activity
 */
export const trackActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { 
      activityType, 
      courseId, 
      lessonId, 
      assignmentId, 
      quizId,
      question,
      questionType,
      responseLength,
      timeSpent,
      resultType,
      resultScore,
      metadata
    } = req.body;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    if (!activityType || !timeSpent) {
      res.status(400).json({ status: 'error', message: 'activityType and timeSpent are required' });
      return;
    }

    const activity = await FalkeAIActivityModel.trackActivity({
      userId,
      activityType,
      courseId,
      lessonId,
      assignmentId,
      quizId,
      question,
      questionType,
      responseLength,
      timeSpent,
      resultType,
      resultScore,
      metadata
    });

    res.status(201).json({ status: 'success', data: activity });
  } catch (error) {
    log.error('❌ Error tracking activity', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', message: 'Failed to track activity' });
  }
};

/**
 * GET /api/analytics
 * Get user analytics
 */
export const getUserAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const analytics = await FalkeAIActivityModel.getUserAnalytics(userId);
    
    if (!analytics) {
      // Return empty analytics for new users
      res.status(200).json({ 
        status: 'success', 
        data: {
          totalActivities: 0,
          activitiesByType: {},
          averageResponseQuality: 0,
          assignmentCompletionRate: 0,
          averageSolutionAccuracy: 0,
          topicsExplored: [],
          conceptsMastered: [],
          conceptsStruggling: [],
          peakLearningTime: 'No data',
          averageSessionDuration: 0,
          activityTimeline: [],
          growthScore: 0,
          engagementTrend: 'stable',
          lastUpdated: new Date()
        }
      });
      return;
    }

    res.status(200).json({ status: 'success', data: analytics });
  } catch (error) {
    log.error('❌ Error getting user analytics', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', message: 'Failed to get user analytics' });
  }
};

/**
 * GET /api/analytics/summary
 * Get a quick summary of user analytics for the dashboard
 */
export const getAnalyticsSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const summary = await FalkeAIActivityModel.getActivitySummary(userId);
    res.status(200).json({ status: 'success', data: summary });
  } catch (error) {
    log.error('❌ Error getting analytics summary', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', message: 'Failed to get analytics summary' });
  }
};

/**
 * GET /api/analytics/activities
 * Get user activities with filtering
 */
export const getActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { activityType, startDate, endDate, limit, skip } = req.query;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const result = await FalkeAIActivityModel.getActivities(userId, {
      activityType: activityType as FalkeAIActivityType,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined
    });

    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    log.error('❌ Error getting activities', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', message: 'Failed to get activities' });
  }
};

/**
 * POST /api/analytics/rate/:activityId
 * Rate an activity
 */
export const rateActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const activityId = getParamId(req.params.activityId);
    const { rating } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ status: 'error', message: 'Rating must be between 1 and 5' });
      return;
    }

    const activity = await FalkeAIActivityModel.rateActivity(activityId, rating);
    
    if (!activity) {
      res.status(404).json({ status: 'error', message: 'Activity not found' });
      return;
    }

    res.status(200).json({ status: 'success', data: activity });
  } catch (error) {
    log.error('❌ Error rating activity', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', message: 'Failed to rate activity' });
  }
};

/**
 * GET /api/analytics/dashboard
 * Get comprehensive dashboard analytics
 */
export const getDashboardAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    // Get all analytics data in parallel
    const [
      userAnalytics,
      recentActivities
    ] = await Promise.all([
      FalkeAIActivityModel.getUserAnalytics(userId),
      FalkeAIActivityModel.getActivities(userId, { limit: 10 })
    ]);

    // Build comprehensive dashboard data
    const dashboardData = {
      // Overview KPIs
      overview: {
        totalQuestions: userAnalytics?.activitiesByType?.chat_question || 0,
        averageResponseQuality: userAnalytics?.averageResponseQuality || 0,
        topicsMastered: userAnalytics?.conceptsMastered?.length || 0,
        topicsStruggling: userAnalytics?.conceptsStruggling?.length || 0
      },

      // Learning patterns
      learning: {
        topicsExplored: userAnalytics?.topicsExplored || [],
        conceptsMastered: userAnalytics?.conceptsMastered || [],
        conceptsToReview: userAnalytics?.conceptsStruggling || [],
        peakLearningTime: userAnalytics?.peakLearningTime || 'No data',
        averageSessionDuration: userAnalytics?.averageSessionDuration || 0
      },

      // Trends
      trends: {
        activityTimeline: userAnalytics?.activityTimeline || [],
        growthScore: userAnalytics?.growthScore || 0,
        engagementTrend: userAnalytics?.engagementTrend || 'stable',
        activitiesByType: userAnalytics?.activitiesByType || {}
      },

      // AI Insights
      insights: {
        predictedNextChallenge: userAnalytics?.predictedNextChallenge,
        estimatedMasteryDate: userAnalytics?.estimatedMasteryDate,
        recommendedFocusArea: userAnalytics?.recommendedFocusArea || 'Continue current learning path'
      },

      // Recent activity
      recentActivity: recentActivities.activities,

      // Metadata
      lastUpdated: userAnalytics?.lastUpdated || new Date()
    };

    res.status(200).json({ status: 'success', data: dashboardData });
  } catch (error) {
    log.error('❌ Error getting dashboard analytics', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', message: 'Failed to get dashboard analytics' });
  }
};

/**
 * POST /api/analytics/refresh
 * Force refresh user analytics
 */
export const refreshAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const analytics = await FalkeAIActivityModel.updateUserAnalytics(userId);
    res.status(200).json({ status: 'success', data: analytics });
  } catch (error) {
    log.error('❌ Error refreshing analytics', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', message: 'Failed to refresh analytics' });
  }
};
