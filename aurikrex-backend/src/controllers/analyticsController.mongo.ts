import { Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService.mongo.js';
import { log } from '../utils/logger.js';

/**
 * Track lesson completion
 */
export const trackCompletion = async (req: Request, res: Response): Promise<void> => {
  try {
    const lessonId = req.params.id as string;
    const userId = req.user?.userId;
    const { timeSpent, rating, struggledSections } = req.body;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    console.log('📊 Tracking completion:', { lessonId, userId, timeSpent, rating });

    await AnalyticsService.trackCompletion(lessonId, userId, {
      timeSpent,
      rating,
      struggledSections
    });

    console.log('✅ Completion tracked successfully');

    res.status(200).json({
      status: 'success',
      message: 'Completion tracked successfully'
    });
  } catch (error) {
    console.error('❌ Error tracking completion:', error);
    log.error('Error tracking completion', { error });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to track completion'
    });
  }
};

/**
 * Track exercise attempt
 */
export const trackExercise = async (req: Request, res: Response): Promise<void> => {
  try {
    const lessonId = req.params.id as string;
    const exerciseId = req.params.exerciseId as string;
    const userId = req.user?.userId;
    const { correct, timeSpent, attempts } = req.body;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    console.log('📊 Tracking exercise:', { lessonId, exerciseId, userId, correct });

    await AnalyticsService.trackExercise(lessonId, userId, exerciseId, {
      correct,
      timeSpent,
      attempts
    });

    console.log('✅ Exercise tracked successfully');

    res.status(200).json({
      status: 'success',
      message: 'Exercise attempt tracked successfully'
    });
  } catch (error) {
    console.error('❌ Error tracking exercise:', error);
    log.error('Error tracking exercise', { error });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to track exercise attempt'
    });
  }
};

/**
 * Get lesson analytics
 */
export const getLessonAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const lessonId = req.params.id as string;

    console.log('📊 Getting lesson analytics:', lessonId);

    const analytics = await AnalyticsService.getLessonAnalytics(lessonId);

    if (!analytics) {
      res.status(404).json({
        status: 'error',
        message: 'No analytics found for this lesson'
      });
      return;
    }

    console.log('✅ Analytics retrieved successfully');

    res.status(200).json({
      status: 'success',
      data: analytics
    });
  } catch (error) {
    console.error('❌ Error getting analytics:', error);
    log.error('Error getting analytics', { error });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to get analytics'
    });
  }
};

/**
 * Get user engagement for a lesson
 */
export const getUserEngagement = async (req: Request, res: Response): Promise<void> => {
  try {
    const lessonId = req.params.id as string;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    console.log('📊 Getting user engagement:', { lessonId, userId });

    const engagement = await AnalyticsService.getUserEngagement(userId, lessonId);

    if (!engagement) {
      res.status(404).json({
        status: 'error',
        message: 'No engagement data found'
      });
      return;
    }

    console.log('✅ Engagement data retrieved successfully');

    res.status(200).json({
      status: 'success',
      data: engagement
    });
  } catch (error) {
    console.error('❌ Error getting engagement:', error);
    log.error('Error getting engagement', { error });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to get engagement data'
    });
  }
};

/**
 * Get all user engagement
 */
export const getAllUserEngagement = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    console.log('📊 Getting all user engagement:', userId);

    const engagements = await AnalyticsService.getAllUserEngagement(userId);

    console.log(`✅ Retrieved ${engagements.length} engagement records`);

    res.status(200).json({
      status: 'success',
      data: engagements
    });
  } catch (error) {
    console.error('❌ Error getting all engagement:', error);
    log.error('Error getting all engagement', { error });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to get engagement data'
    });
  }
};
