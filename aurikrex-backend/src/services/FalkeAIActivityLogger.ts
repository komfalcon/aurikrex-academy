/**
 * FalkeAI Activity Logger Service
 * 
 * Centralized service for logging ALL FalkeAI interactions.
 * This service automatically tracks:
 * - Chat questions
 * - Assignment uploads and analysis
 * - Solution uploads and verification
 * - Lesson generation
 * - Quiz explanations
 * - Progress analysis
 * 
 * Usage: Call logActivity() after every FalkeAI interaction to track user engagement.
 */

import { log } from '../utils/logger.js';
import { 
  FalkeAIActivityModel, 
  FalkeAIActivityType,
  ResultType 
} from '../models/FalkeAIActivity.model.js';

/**
 * Activity metadata that can be attached to any activity
 */
export interface ActivityMetadata {
  topic?: string;
  concepts?: string[];
  conceptsMastered?: string[];
  conceptsStruggling?: string[];
  subject?: string;
  difficulty?: string;
  provider?: string;
  model?: string;
  [key: string]: unknown;
}

/**
 * Base activity logging data
 */
export interface LogActivityData {
  userId: string;
  activityType: FalkeAIActivityType;
  timeSpent: number; // in seconds
  courseId?: string;
  lessonId?: string;
  assignmentId?: string;
  quizId?: string;
  question?: string;
  questionType?: string;
  responseLength?: number;
  resultType?: ResultType;
  resultScore?: number;
  metadata?: ActivityMetadata;
}

/**
 * Chat question activity data
 */
export interface ChatQuestionData {
  userId: string;
  question: string;
  responseLength: number;
  timeSpent: number;
  topic?: string;
  concepts?: string[];
  provider?: string;
  model?: string;
  courseId?: string;
  lessonId?: string;
}

/**
 * Assignment activity data
 */
export interface AssignmentActivityData {
  userId: string;
  assignmentId: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  timeSpent: number;
}

/**
 * Solution activity data
 */
export interface SolutionActivityData {
  userId: string;
  assignmentId: string;
  solutionId?: string;
  accuracy?: number;
  conceptsMastered?: string[];
  conceptsToReview?: string[];
  timeSpent: number;
}

/**
 * Lesson generation activity data
 */
export interface LessonGenerationData {
  userId: string;
  lessonId: string;
  topic: string;
  difficulty?: string;
  timeSpent: number;
  provider?: string;
  model?: string;
}

/**
 * FalkeAI Activity Logger Service
 * 
 * Provides convenient methods for logging different types of activities.
 */
export class FalkeAIActivityLogger {

  /**
   * Log any FalkeAI activity
   */
  static async logActivity(data: LogActivityData): Promise<void> {
    try {
      await FalkeAIActivityModel.trackActivity({
        userId: data.userId,
        activityType: data.activityType,
        courseId: data.courseId,
        lessonId: data.lessonId,
        assignmentId: data.assignmentId,
        quizId: data.quizId,
        question: data.question,
        questionType: data.questionType,
        responseLength: data.responseLength,
        timeSpent: data.timeSpent,
        resultType: data.resultType,
        resultScore: data.resultScore,
        metadata: data.metadata,
      });

      log.debug('📊 Activity logged', {
        userId: data.userId,
        type: data.activityType,
      });
    } catch (error) {
      log.error('❌ Failed to log activity', {
        error: error instanceof Error ? error.message : String(error),
        userId: data.userId,
        type: data.activityType,
      });
      // Don't throw - activity logging should not break the main flow
    }
  }

  /**
   * Log a chat question interaction
   */
  static async logChatQuestion(data: ChatQuestionData): Promise<void> {
    await this.logActivity({
      userId: data.userId,
      activityType: 'chat_question',
      question: data.question,
      responseLength: data.responseLength,
      timeSpent: data.timeSpent,
      courseId: data.courseId,
      lessonId: data.lessonId,
      metadata: {
        topic: data.topic,
        concepts: data.concepts,
        provider: data.provider,
        model: data.model,
      },
    });
  }

  /**
   * Log an assignment upload
   */
  static async logAssignmentUpload(data: AssignmentActivityData): Promise<void> {
    await this.logActivity({
      userId: data.userId,
      activityType: 'assignment_upload',
      assignmentId: data.assignmentId,
      timeSpent: data.timeSpent,
      metadata: {
        subject: data.subject,
        topic: data.topic,
        difficulty: data.difficulty,
      },
    });
  }

  /**
   * Log an assignment analysis by FalkeAI
   */
  static async logAssignmentAnalysis(data: AssignmentActivityData): Promise<void> {
    await this.logActivity({
      userId: data.userId,
      activityType: 'assignment_analysis',
      assignmentId: data.assignmentId,
      timeSpent: data.timeSpent,
      metadata: {
        subject: data.subject,
        topic: data.topic,
        difficulty: data.difficulty,
      },
    });
  }

  /**
   * Log a solution upload
   */
  static async logSolutionUpload(data: SolutionActivityData): Promise<void> {
    await this.logActivity({
      userId: data.userId,
      activityType: 'solution_upload',
      assignmentId: data.assignmentId,
      timeSpent: data.timeSpent,
      metadata: {
        solutionId: data.solutionId,
      },
    });
  }

  /**
   * Log a solution verification by FalkeAI
   */
  static async logSolutionVerification(data: SolutionActivityData): Promise<void> {
    await this.logActivity({
      userId: data.userId,
      activityType: 'solution_verification',
      assignmentId: data.assignmentId,
      timeSpent: data.timeSpent,
      resultType: data.accuracy && data.accuracy >= 70 ? 'success' : 'needs_improvement',
      resultScore: data.accuracy,
      metadata: {
        solutionId: data.solutionId,
        conceptsMastered: data.conceptsMastered,
        conceptsStruggling: data.conceptsToReview,
      },
    });
  }

  /**
   * Log a lesson generation
   */
  static async logLessonGeneration(data: LessonGenerationData): Promise<void> {
    await this.logActivity({
      userId: data.userId,
      activityType: 'lesson_generation',
      lessonId: data.lessonId,
      timeSpent: data.timeSpent,
      metadata: {
        topic: data.topic,
        difficulty: data.difficulty,
        provider: data.provider,
        model: data.model,
      },
    });
  }

  /**
   * Log a quiz explanation request
   */
  static async logQuizExplanation(data: {
    userId: string;
    quizId: string;
    question?: string;
    timeSpent: number;
  }): Promise<void> {
    await this.logActivity({
      userId: data.userId,
      activityType: 'quiz_explanation',
      quizId: data.quizId,
      question: data.question,
      timeSpent: data.timeSpent,
    });
  }

  /**
   * Log a concept explanation request
   */
  static async logConceptExplanation(data: {
    userId: string;
    question: string;
    responseLength: number;
    timeSpent: number;
    topic?: string;
    courseId?: string;
    lessonId?: string;
  }): Promise<void> {
    await this.logActivity({
      userId: data.userId,
      activityType: 'concept_explanation',
      question: data.question,
      responseLength: data.responseLength,
      timeSpent: data.timeSpent,
      courseId: data.courseId,
      lessonId: data.lessonId,
      metadata: {
        topic: data.topic,
      },
    });
  }

  /**
   * Log a progress analysis
   */
  static async logProgressAnalysis(data: {
    userId: string;
    timeSpent: number;
    growthScore?: number;
  }): Promise<void> {
    await this.logActivity({
      userId: data.userId,
      activityType: 'progress_analysis',
      timeSpent: data.timeSpent,
      resultScore: data.growthScore,
    });
  }

  /**
   * Log a recommendation
   */
  static async logRecommendation(data: {
    userId: string;
    timeSpent: number;
    recommendationType?: string;
    topic?: string;
  }): Promise<void> {
    await this.logActivity({
      userId: data.userId,
      activityType: 'recommendation',
      timeSpent: data.timeSpent,
      metadata: {
        recommendationType: data.recommendationType,
        topic: data.topic,
      },
    });
  }

  /**
   * Log a performance review
   */
  static async logPerformanceReview(data: {
    userId: string;
    timeSpent: number;
    overallScore?: number;
    strengths?: string[];
    areasToImprove?: string[];
  }): Promise<void> {
    await this.logActivity({
      userId: data.userId,
      activityType: 'performance_review',
      timeSpent: data.timeSpent,
      resultScore: data.overallScore,
      metadata: {
        strengths: data.strengths,
        areasToImprove: data.areasToImprove,
      },
    });
  }
}

// Export for convenience
export const falkeAIActivityLogger = FalkeAIActivityLogger;
export default FalkeAIActivityLogger;
