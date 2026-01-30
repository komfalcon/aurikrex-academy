/**
 * Dashboard Data Service
 * 
 * Centralized service for fetching and aggregating dashboard data.
 * Combines data from multiple sources (assignments, analytics, conversations)
 * to provide a comprehensive view of student activity and progress.
 * 
 * ALL DATA IS REAL - NO MOCK DATA
 */

import { log } from '../utils/logger.js';
import { AssignmentModel } from '../models/Assignment.model.js';
import { SolutionModel } from '../models/Solution.model.js';
import { FalkeAIActivityModel, UserAnalyticsDocument } from '../models/FalkeAIActivity.model.js';
import { ConversationModel } from '../models/Conversation.model.js';

/**
 * Dashboard overview statistics
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
  timestamp: Date;
  data?: Record<string, unknown>;
}

/**
 * Course progress
 */
export interface CourseProgress {
  courseId: string;
  title: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
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
  createdAt: Date;
  lastAttemptAt?: Date;
  accuracy?: number;
}

/**
 * Full dashboard data
 */
export interface DashboardData {
  overview: OverviewStats;
  recentActivity: RecentActivityItem[];
  courses: CourseProgress[];
  analytics: LearningAnalytics;
  assignments: AssignmentSummary[];
  conversations: {
    total: number;
    recent: {
      _id: string;
      title: string;
      topic?: string;
      lastUpdatedAt: Date;
    }[];
  };
}

/**
 * Dashboard Data Service
 * Aggregates data from multiple sources for the dashboard
 */
export class DashboardDataService {

  /**
   * Get comprehensive dashboard data for a user
   */
  static async getDashboardData(userId: string): Promise<DashboardData> {
    log.info('📊 Fetching dashboard data', { userId });

    try {
      // Fetch all data in parallel for performance
      const [
        overviewStats,
        recentActivity,
        courses,
        analytics,
        assignments,
        conversations
      ] = await Promise.all([
        this.getOverviewStats(userId),
        this.getRecentActivity(userId),
        this.getStudentCourses(userId),
        this.getAnalytics(userId),
        this.getAssignments(userId),
        this.getConversations(userId),
      ]);

      log.info('✅ Dashboard data fetched successfully', { userId });

      return {
        overview: overviewStats,
        recentActivity,
        courses,
        analytics,
        assignments,
        conversations,
      };
    } catch (error) {
      log.error('❌ Error fetching dashboard data', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Get overview statistics
   */
  static async getOverviewStats(userId: string): Promise<OverviewStats> {
    try {
      // Get assignment stats
      const assignmentStats = await AssignmentModel.getStats(userId);
      
      // Get solution stats
      const solutionStats = await SolutionModel.getStats(userId);
      
      // Get activity analytics
      const userAnalytics = await FalkeAIActivityModel.getUserAnalytics(userId);

      // Calculate total learning hours from activity time spent
      const totalSeconds = userAnalytics?.averageSessionDuration 
        ? userAnalytics.averageSessionDuration * (userAnalytics.totalActivities || 0) 
        : 0;
      // Convert seconds to hours: seconds / 3600
      const totalHours = Math.round((totalSeconds / 3600) * 10) / 10; // Round to 1 decimal place

      // Calculate streak (consecutive days with activity)
      const streak = this.calculateStreak(userAnalytics);

      return {
        totalCoursesEnrolled: 0, // Will be updated when courses feature is active
        coursesCompleted: 0,
        assignmentsSubmitted: assignmentStats.submitted + assignmentStats.graded,
        currentStreak: streak,
        totalLearningHours: totalHours,
        totalQuestions: userAnalytics?.activitiesByType?.chat_question || 0,
        averageScore: solutionStats.averageAccuracy,
      };
    } catch (error) {
      log.error('❌ Error getting overview stats', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
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
  }

  /**
   * Calculate current streak from activity timeline
   */
  private static calculateStreak(analytics: UserAnalyticsDocument | null): number {
    if (!analytics?.activityTimeline || analytics.activityTimeline.length === 0) {
      return 0;
    }

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort timeline by date descending
    const sortedTimeline = [...analytics.activityTimeline].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Check for consecutive days
    let expectedDate = new Date(today);
    
    for (const entry of sortedTimeline) {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      
      // Check if this is the expected date or yesterday
      const diffDays = Math.floor(
        (expectedDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diffDays <= 1 && entry.count > 0) {
        streak++;
        expectedDate = new Date(entryDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else if (diffDays > 1) {
        break; // Streak broken
      }
    }

    return streak;
  }

  /**
   * Get recent activity for a user
   */
  static async getRecentActivity(userId: string, limit: number = 10): Promise<RecentActivityItem[]> {
    try {
      const { activities } = await FalkeAIActivityModel.getActivities(userId, { limit });

      return activities.map(activity => ({
        type: activity.activityType,
        description: this.getActivityDescription(activity),
        timestamp: activity.timestamp,
        data: {
          assignmentId: activity.assignmentId,
          lessonId: activity.lessonId,
          courseId: activity.courseId,
          resultScore: activity.resultScore,
        },
      }));
    } catch (error) {
      log.error('❌ Error getting recent activity', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return [];
    }
  }

  /**
   * Get human-readable activity description
   */
  private static getActivityDescription(activity: {
    activityType: string;
    question?: string;
    resultScore?: number;
    metadata?: Record<string, unknown>;
  }): string {
    const typeDescriptions: Record<string, string> = {
      'chat_question': 'Asked a question to FalkeAI',
      'assignment_upload': 'Uploaded a new assignment',
      'assignment_analysis': 'Assignment was analyzed by FalkeAI',
      'solution_upload': 'Submitted a solution',
      'solution_verification': 'Solution was reviewed by FalkeAI',
      'quiz_explanation': 'Received quiz explanation',
      'progress_analysis': 'Progress was analyzed',
      'recommendation': 'Received learning recommendation',
      'concept_explanation': 'Received concept explanation',
      'performance_review': 'Performance was reviewed',
      'lesson_generation': 'Generated a new lesson',
    };

    let description = typeDescriptions[activity.activityType] || 'Performed an activity';

    // Add score if available
    if (activity.resultScore !== undefined) {
      description += ` (Score: ${activity.resultScore}%)`;
    }

    // Add question preview if available
    if (activity.question && activity.question.length > 0) {
      const preview = activity.question.substring(0, 50);
      description += `: "${preview}${activity.question.length > 50 ? '...' : ''}"`;
    }

    return description;
  }

  /**
   * Get student courses with progress
   * Note: This returns empty for now as courses feature needs to be implemented
   */
  static async getStudentCourses(_userId: string): Promise<CourseProgress[]> {
    // TODO: Implement when courses feature is active
    // For now, return empty array
    return [];
  }

  /**
   * Get learning analytics
   */
  static async getAnalytics(userId: string): Promise<LearningAnalytics> {
    try {
      const userAnalytics = await FalkeAIActivityModel.getUserAnalytics(userId);
      const solutionStats = await SolutionModel.getStats(userId);

      return {
        averageQuestionQuality: userAnalytics?.averageResponseQuality || 0,
        assignmentAccuracy: solutionStats.averageAccuracy,
        topicsExplored: userAnalytics?.topicsExplored || [],
        conceptsMastered: solutionStats.conceptsMastered || userAnalytics?.conceptsMastered || [],
        conceptsStruggling: solutionStats.conceptsToReview || userAnalytics?.conceptsStruggling || [],
        growthScore: userAnalytics?.growthScore || 0,
        peakLearningTime: userAnalytics?.peakLearningTime || 'Not enough data',
        engagementTrend: userAnalytics?.engagementTrend || 'stable',
      };
    } catch (error) {
      log.error('❌ Error getting analytics', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
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
  }

  /**
   * Get recent assignments
   */
  static async getAssignments(userId: string, limit: number = 5): Promise<AssignmentSummary[]> {
    try {
      const { assignments } = await AssignmentModel.findByStudentId(userId, {
        limit,
        sortBy: 'createdAt',
        sortOrder: -1,
      });

      return assignments.map(assignment => ({
        _id: assignment._id?.toString() || '',
        title: assignment.title,
        status: assignment.status,
        createdAt: assignment.createdAt,
        lastAttemptAt: assignment.lastAttemptAt,
      }));
    } catch (error) {
      log.error('❌ Error getting assignments', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return [];
    }
  }

  /**
   * Get conversation summary
   */
  static async getConversations(userId: string, limit: number = 5): Promise<{
    total: number;
    recent: {
      _id: string;
      title: string;
      topic?: string;
      lastUpdatedAt: Date;
    }[];
  }> {
    try {
      const { conversations, total } = await ConversationModel.findByUserId(userId, { limit });

      return {
        total,
        recent: conversations.map(conv => ({
          _id: conv._id.toString(),
          title: conv.title,
          topic: conv.topic,
          lastUpdatedAt: conv.lastUpdatedAt,
        })),
      };
    } catch (error) {
      log.error('❌ Error getting conversations', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return { total: 0, recent: [] };
    }
  }

  /**
   * Get quick stats for dashboard header
   */
  static async getQuickStats(userId: string): Promise<{
    totalActivities: number;
    assignmentsPending: number;
    questionsToday: number;
    growthScore: number;
  }> {
    try {
      const [userAnalytics, assignmentStats] = await Promise.all([
        FalkeAIActivityModel.getUserAnalytics(userId),
        AssignmentModel.getStats(userId),
      ]);

      // Count questions asked today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayEntry = userAnalytics?.activityTimeline?.find(entry => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      });

      return {
        totalActivities: userAnalytics?.totalActivities || 0,
        assignmentsPending: assignmentStats.pending + assignmentStats.analyzed,
        questionsToday: todayEntry?.types?.chat_question || 0,
        growthScore: userAnalytics?.growthScore || 0,
      };
    } catch (error) {
      log.error('❌ Error getting quick stats', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return {
        totalActivities: 0,
        assignmentsPending: 0,
        questionsToday: 0,
        growthScore: 0,
      };
    }
  }
}

export const dashboardDataService = DashboardDataService;
export default DashboardDataService;
