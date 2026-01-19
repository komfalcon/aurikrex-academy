import { Request, Response } from 'express';
import { LessonInput } from '../types/lesson.types.js';
import LessonService from '../services/LessonService.mongo.js';
import { validateSchema } from '../utils/validation.js';
import { ValidationError } from '../utils/errors.js';
import { lessonInputSchema } from '../utils/schemas.js';
import { log } from '../utils/logger.js';
import { AnalyticsService } from '../services/AnalyticsService.mongo.js';

/**
 * Generate a new lesson
 */
export const generateLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const input: LessonInput = {
      subject: req.body.subject,
      topic: req.body.topic,
      targetGrade: parseInt(req.body.targetGrade, 10),
      lessonLength: req.body.lessonLength,
      difficulty: req.body.difficulty,
      additionalInstructions: req.body.additionalInstructions
    };

    // Get author ID from authenticated user
    const authorId = req.user?.userId || 'system';

    console.log('🎓 Generating lesson:', input);

    // Validate input using schema
    try {
      validateSchema(input, lessonInputSchema);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid input',
          errors: (error as ValidationError & { details?: { errors: string[] } }).details?.errors || ['Validation failed']
        });
        return;
      }
      throw error;
    }

    // Generate and save lesson
    const lesson = await LessonService.generateAndSaveLesson(authorId, input);

    console.log('✅ Lesson generated successfully:', lesson.id);

    res.status(201).json({
      status: 'success',
      message: 'Lesson generated successfully',
      data: lesson
    });
  } catch (error) {
    console.error('❌ Error generating lesson:', error);
    log.error('Error generating lesson', { error });
    
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to generate lesson'
    });
  }
};

/**
 * Get a lesson by ID
 */
export const getLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.userId;

    console.log('🔍 Getting lesson:', id);

    const lesson = await LessonService.getLessonById(id);

    // Track view if user is authenticated
    if (userId) {
      await AnalyticsService.trackView(id, userId);
    }

    console.log('✅ Lesson retrieved:', lesson.title);

    res.status(200).json({
      status: 'success',
      data: lesson
    });
  } catch (error) {
    console.error('❌ Error getting lesson:', error);
    log.error('Error getting lesson', { error, lessonId: req.params.id });
    
    res.status(404).json({
      status: 'error',
      message: 'Lesson not found'
    });
  }
};

/**
 * List lessons with filters and pagination
 */
export const listLessons = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const authorId = req.query.authorId as string;
    const status = req.query.status as any;
    const subject = req.query.subject as string;
    const difficulty = req.query.difficulty as any;

    console.log('📋 Listing lessons:', { page, limit, authorId, status, subject, difficulty });

    const result = await LessonService.listLessons(
      { authorId, status, subject, difficulty },
      { page, limit }
    );

    console.log(`✅ Listed ${result.items.length} lessons`);

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('❌ Error listing lessons:', error);
    log.error('Error listing lessons', { error });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to list lessons'
    });
  }
};

/**
 * Update a lesson
 */
export const updateLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updateData = req.body;

    console.log('📝 Updating lesson:', id);

    const lesson = await LessonService.updateLesson(id, updateData);

    console.log('✅ Lesson updated:', lesson.title);

    res.status(200).json({
      status: 'success',
      message: 'Lesson updated successfully',
      data: lesson
    });
  } catch (error) {
    console.error('❌ Error updating lesson:', error);
    log.error('Error updating lesson', { error, lessonId: req.params.id });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update lesson'
    });
  }
};

/**
 * Delete a lesson
 */
export const deleteLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    console.log('🗑️ Deleting lesson:', id);

    await LessonService.deleteLesson(id);

    console.log('✅ Lesson deleted successfully');

    res.status(200).json({
      status: 'success',
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting lesson:', error);
    log.error('Error deleting lesson', { error, lessonId: req.params.id });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete lesson'
    });
  }
};

/**
 * Update lesson progress
 */
export const updateProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.userId;
    const progressData = req.body;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    console.log('📊 Updating progress:', { userId, lessonId: id });

    const progress = await LessonService.updateProgress(userId, id, progressData);

    console.log('✅ Progress updated successfully');

    res.status(200).json({
      status: 'success',
      message: 'Progress updated successfully',
      data: progress
    });
  } catch (error) {
    console.error('❌ Error updating progress:', error);
    log.error('Error updating progress', { error, lessonId: req.params.id });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update progress'
    });
  }
};

/**
 * Get lesson progress
 */
export const getProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    console.log('🔍 Getting progress:', { userId, lessonId: id });

    const progress = await LessonService.getProgress(userId, id);

    if (!progress) {
      res.status(404).json({
        status: 'error',
        message: 'No progress found for this lesson'
      });
      return;
    }

    console.log('✅ Progress retrieved successfully');

    res.status(200).json({
      status: 'success',
      data: progress
    });
  } catch (error) {
    console.error('❌ Error getting progress:', error);
    log.error('Error getting progress', { error, lessonId: req.params.id });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to get progress'
    });
  }
};

/**
 * Get user's all lesson progress
 */
export const getUserProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    console.log('📊 Getting all progress for user:', userId);

    const progressList = await LessonService.getUserProgress(userId);

    console.log(`✅ Retrieved ${progressList.length} progress records`);

    res.status(200).json({
      status: 'success',
      data: progressList
    });
  } catch (error) {
    console.error('❌ Error getting user progress:', error);
    log.error('Error getting user progress', { error });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user progress'
    });
  }
};
