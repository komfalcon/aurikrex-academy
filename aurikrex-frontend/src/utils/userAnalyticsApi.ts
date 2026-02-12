/**
 * User Analytics API Service
 * 
 * Provides functions for fetching user-specific analytics data.
 * All data comes from the UserActivity collection via the backend API.
 */

import { apiRequest } from './api';
import type { 
  UserAnalyticsData,
  ActivityTimelineEntry,
  DailyBreakdown 
} from '../types';

interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

/**
 * Get user analytics data
 * Fetches metrics from GET /api/user/analytics
 */
export async function getUserAnalytics(): Promise<UserAnalyticsData> {
  const response = await apiRequest('/user/analytics');

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to get user analytics');
  }

  const result: ApiResponse<UserAnalyticsData> = await response.json();
  return result.data || getEmptyUserAnalytics();
}

/**
 * Get empty user analytics for new users
 */
function getEmptyUserAnalytics(): UserAnalyticsData {
  return {
    totalQuestions: 0,
    dailyStreak: 0,
    totalDaysSpent: 0,
    activityTimeline: [],
    dailyBreakdown: {
      chat: 0,
      login: 0,
      library_view: 0,
      book_upload: 0,
    },
  };
}

export default {
  getUserAnalytics,
};
