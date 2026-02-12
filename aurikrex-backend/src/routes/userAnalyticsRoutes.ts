/**
 * User Analytics Routes
 * 
 * Routes for user-specific analytics in Aurikrex Academy.
 * All routes require authentication via JWT.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getUserAnalytics, getExtendedAnalytics } from '../controllers/userAnalyticsController.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/user/analytics
 * @desc    Get analytics data for the authenticated user
 * @access  Private (requires authentication)
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
router.get('/analytics', getUserAnalytics);

/**
 * @route   GET /api/user/analytics/extended
 * @desc    Get extended analytics including FalkeAI insights and assignment performance
 * @access  Private (requires authentication)
 * 
 * Response (extends base analytics with):
 * {
 *   ...baseAnalytics,
 *   learningInsights: { peakLearningTime, averageSessionLength, lastUpdated },
 *   assignmentPerformance: { completed, inProgress, pending, accuracy },
 *   falkeAIInsights: { focusArea, strengths, weaknesses, engagementTrend, growthScore, lastUpdated },
 *   topicsMastered: string[]
 * }
 */
router.get('/analytics/extended', getExtendedAnalytics);

export default router;
