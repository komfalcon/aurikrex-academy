/**
 * Dashboard API Service
 * 
 * Provides functions for fetching dashboard data from the backend.
 * All functions use real backend endpoints - NO MOCK DATA.
 */

import { apiRequest } from './api';

/**
 * Overview statistics
 */
export interface OverviewStats {
  totalCoursesEnrolled: number;
  coursesCompleted: number;
  assignmentsSubmitted: number;
  currentStreak: number;
  totalLearningHours: number;
  totalQuestions: number;
  averageScore: number;
}

/**
 * Recent activity item
 */
export interface RecentActivityItem {
  type: string;
  description: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

/**
 * Learning analytics
 */
export interface LearningAnalytics {
  averageQuestionQuality: number;
  assignmentAccuracy: number;
  topicsExplored: string[];
  conceptsMastered: string[];
  conceptsStruggling: string[];
  growthScore: number;
  peakLearningTime: string;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
}

/**
 * Assignment summary
 */
export interface AssignmentSummary {
  _id: string;
  title: string;
  status: string;
  createdAt: string;
  lastAttemptAt?: string;
  accuracy?: number;
}

/**
 * Conversation summary
 */
export interface ConversationSummary {
  _id: string;
  title: string;
  topic?: string;
  lastUpdatedAt: string;
}

/**
 * Full dashboard data
 */
export interface DashboardData {
  overview: OverviewStats;
  recentActivity: RecentActivityItem[];
  courses: {
    courseId: string;
    title: string;
    progress: number;
    completedLessons: number;
    totalLessons: number;
    progressPercent: number;
  }[];
  analytics: LearningAnalytics;
  assignments: AssignmentSummary[];
  conversations: {
    total: number;
    recent: ConversationSummary[];
  };
}

/**
 * Quick stats for dashboard header
 */
export interface QuickStats {
  totalActivities: number;
  assignmentsPending: number;
  questionsToday: number;
  growthScore: number;
}

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

// ============================================
// Dashboard Data Functions
// ============================================

/**
 * Get comprehensive dashboard data
 */
export async function getDashboardData(): Promise<DashboardData> {
  const response = await apiRequest('/dashboard/data');

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to get dashboard data');
  }

  const result: ApiResponse<DashboardData> = await response.json();
  return result.data || getEmptyDashboardData();
}

/**
 * Get overview statistics
 */
export async function getOverviewStats(): Promise<OverviewStats> {
  const response = await apiRequest('/dashboard/overview');

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to get overview stats');
  }

  const result: ApiResponse<OverviewStats> = await response.json();
  return result.data || getEmptyOverviewStats();
}

/**
 * Get recent activity feed
 */
export async function getRecentActivity(limit: number = 10): Promise<RecentActivityItem[]> {
  const response = await apiRequest(`/dashboard/activity?limit=${limit}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to get recent activity');
  }

  const result: ApiResponse<RecentActivityItem[]> = await response.json();
  return result.data || [];
}

/**
 * Get learning analytics
 */
export async function getLearningAnalytics(): Promise<LearningAnalytics> {
  const response = await apiRequest('/dashboard/analytics');

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to get learning analytics');
  }

  const result: ApiResponse<LearningAnalytics> = await response.json();
  return result.data || getEmptyAnalytics();
}

/**
 * Get quick stats for dashboard header
 */
export async function getQuickStats(): Promise<QuickStats> {
  const response = await apiRequest('/dashboard/quick-stats');

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to get quick stats');
  }

  const result: ApiResponse<QuickStats> = await response.json();
  return result.data || {
    totalActivities: 0,
    assignmentsPending: 0,
    questionsToday: 0,
    growthScore: 0,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get empty dashboard data for new users
 */
function getEmptyDashboardData(): DashboardData {
  return {
    overview: getEmptyOverviewStats(),
    recentActivity: [],
    courses: [],
    analytics: getEmptyAnalytics(),
    assignments: [],
    conversations: {
      total: 0,
      recent: [],
    },
  };
}

/**
 * Get empty overview stats
 */
function getEmptyOverviewStats(): OverviewStats {
  return {
    totalCoursesEnrolled: 0,
    coursesCompleted: 0,
    assignmentsSubmitted: 0,
    currentStreak: 0,
    totalLearningHours: 0,
    totalQuestions: 0,
    averageScore: 0,
  };
}

/**
 * Get empty analytics
 */
function getEmptyAnalytics(): LearningAnalytics {
  return {
    averageQuestionQuality: 0,
    assignmentAccuracy: 0,
    topicsExplored: [],
    conceptsMastered: [],
    conceptsStruggling: [],
    growthScore: 0,
    peakLearningTime: 'Not enough data',
    engagementTrend: 'stable',
  };
}

export default {
  getDashboardData,
  getOverviewStats,
  getRecentActivity,
  getLearningAnalytics,
  getQuickStats,
};
