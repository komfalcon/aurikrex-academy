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
export declare class AnalyticsService {
    private static readonly analyticsCollection;
    private static readonly engagementCollection;
    /**
     * Track a lesson view
     */
    static trackView(lessonId: string, userId: string): Promise<void>;
    /**
     * Track lesson completion
     */
    static trackCompletion(lessonId: string, userId: string, data: {
        timeSpent: number;
        rating?: number;
        struggledSections?: string[];
    }): Promise<void>;
    /**
     * Track exercise attempt
     */
    static trackExercise(lessonId: string, userId: string, exerciseId: string, data: {
        correct: boolean;
        timeSpent: number;
        attempts: number;
    }): Promise<void>;
    /**
     * Get lesson analytics
     */
    static getLessonAnalytics(lessonId: string): Promise<LessonAnalytics | null>;
    /**
     * Get user engagement data
     */
    static getUserEngagement(userId: string, lessonId: string): Promise<UserEngagement | null>;
}
export {};
