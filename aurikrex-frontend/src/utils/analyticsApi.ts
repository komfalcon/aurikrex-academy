/**
 * FalkeAI Analytics API Service
 * 
 * Provides functions for tracking FalkeAI activities and retrieving user analytics.
 * All functions use real backend endpoints - NO MOCK DATA.
 */

import { apiRequest } from './api';
import type { 
  FalkeAIActivity, 
  FalkeAIActivityType,
  UserAnalytics, 
  DashboardAnalytics,
  ActivitySummary,
  ResultType
} from '../types';

interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

// ============================================
// Activity Tracking
// ============================================

/**
 * Track a FalkeAI activity
 */
export async function trackActivity(data: {
  activityType: FalkeAIActivityType;
  timeSpent: number;
  courseId?: string;
  lessonId?: string;
  assignmentId?: string;
  quizId?: string;
  question?: string;
  questionType?: string;
  responseLength?: number;
  resultType?: ResultType;
  resultScore?: number;
  metadata?: Record<string, unknown>;
}): Promise<FalkeAIActivity> {
  const response = await apiRequest('/falkeai-analytics/track', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to track activity');
  }

  const result: ApiResponse<FalkeAIActivity> = await response.json();
  if (!result.data) {
    throw new Error('No activity data returned');
  }
  return result.data;
}

// ============================================
// Analytics Retrieval
// ============================================

/**
 * Get user analytics
 */
export async function getUserAnalytics(): Promise<UserAnalytics> {
  const response = await apiRequest('/falkeai-analytics');

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to get user analytics');
  }

  const result: ApiResponse<UserAnalytics> = await response.json();
  return result.data || getEmptyAnalytics();
}

/**
 * Get analytics summary for dashboard
 */
export async function getAnalyticsSummary(): Promise<ActivitySummary> {
  const response = await apiRequest('/falkeai-analytics/summary');

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to get analytics summary');
  }

  const result: ApiResponse<ActivitySummary> = await response.json();
  return result.data || {
    totalQuestions: 0,
    averageResponseQuality: 0,
    topicsMastered: 0,
    topicsStruggling: 0,
    recentActivity: [],
    activityByDay: [],
  };
}

/**
 * Get comprehensive dashboard analytics
 */
export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const response = await apiRequest('/falkeai-analytics/dashboard');

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to get dashboard analytics');
  }

  const result: ApiResponse<DashboardAnalytics> = await response.json();
  return result.data || getEmptyDashboardAnalytics();
}

/**
 * Get user activities with filtering
 */
export async function getActivities(options: {
  activityType?: FalkeAIActivityType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  skip?: number;
} = {}): Promise<{ activities: FalkeAIActivity[]; total: number }> {
  const params = new URLSearchParams();
  if (options.activityType) params.append('activityType', options.activityType);
  if (options.startDate) params.append('startDate', options.startDate);
  if (options.endDate) params.append('endDate', options.endDate);
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.skip) params.append('skip', options.skip.toString());

  const url = `/falkeai-analytics/activities${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiRequest(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to get activities');
  }

  const result: ApiResponse<{ activities: FalkeAIActivity[]; total: number }> = await response.json();
  return result.data || { activities: [], total: 0 };
}

/**
 * Rate an activity
 */
export async function rateActivity(activityId: string, rating: 1 | 2 | 3 | 4 | 5): Promise<FalkeAIActivity> {
  const response = await apiRequest(`/falkeai-analytics/rate/${activityId}`, {
    method: 'POST',
    body: JSON.stringify({ rating }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to rate activity');
  }

  const result: ApiResponse<FalkeAIActivity> = await response.json();
  if (!result.data) {
    throw new Error('No activity data returned');
  }
  return result.data;
}

/**
 * Force refresh user analytics
 */
export async function refreshAnalytics(): Promise<UserAnalytics> {
  const response = await apiRequest('/falkeai-analytics/refresh', {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to refresh analytics');
  }

  const result: ApiResponse<UserAnalytics> = await response.json();
  return result.data || getEmptyAnalytics();
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get empty analytics object for new users
 */
function getEmptyAnalytics(): UserAnalytics {
  return {
    userId: '',
    totalActivities: 0,
    activitiesByType: {} as Record<FalkeAIActivityType, number>,
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
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get empty dashboard analytics for new users
 */
function getEmptyDashboardAnalytics(): DashboardAnalytics {
  return {
    overview: {
      totalQuestions: 0,
      averageResponseQuality: 0,
      topicsMastered: 0,
      topicsStruggling: 0,
    },
    assignments: {
      total: 0,
      pending: 0,
      analyzed: 0,
      attempted: 0,
      submitted: 0,
      graded: 0,
      completionRate: 0,
    },
    solutions: {
      totalSolutions: 0,
      averageAccuracy: 0,
      totalCorrect: 0,
      averageAttempts: 0,
      conceptsMastered: [],
      conceptsToReview: [],
    },
    learning: {
      topicsExplored: [],
      conceptsMastered: [],
      conceptsToReview: [],
      peakLearningTime: 'No data',
      averageSessionDuration: 0,
    },
    trends: {
      activityTimeline: [],
      growthScore: 0,
      engagementTrend: 'stable',
      activitiesByType: {},
    },
    insights: {
      recommendedFocusArea: 'Start your learning journey!',
    },
    recentActivity: [],
    lastUpdated: new Date().toISOString(),
  };
}

export default {
  trackActivity,
  getUserAnalytics,
  getAnalyticsSummary,
  getDashboardAnalytics,
  getActivities,
  rateActivity,
  refreshAnalytics,
};
