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
import { UserActivityModel } from '../models/UserActivity.model.js';

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
