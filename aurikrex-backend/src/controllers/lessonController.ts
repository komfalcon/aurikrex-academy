import { Request, Response } from 'express';
import { LessonInput, Lesson, PaginationParams } from '../types/lesson.types.js';
import { defaultConfig } from '../services/BaseAIService.js';
import { GPTProvider } from '../services/GPTProvider.js';
import { GeminiProvider } from '../services/GeminiProvider.js';
import LessonService from '../services/LessonService.js';
import { validateSchema } from '../utils/validation.js';
import { ValidationError } from '../utils/errors.js';
import { lessonInputSchema } from '../utils/schemas.js';
import { log } from '../utils/logger.js';
import { cacheManager } from '../utils/cacheManager.js';

import rateLimit from 'express-rate-limit';

// In-memory cache for lessons (simple Map-based cache)
const lessonCache: Map<string, { lesson: Lesson; timestamp: number }> = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour TTL

// Rate limiting for lesson generation
export const lessonGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many lesson generation requests. Please try again later.'
});



// Check cache and return if lesson exists
const checkCache = (key: string): Lesson | null => {
  const cached = lessonCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.lesson;
  }
  if (cached) {
    lessonCache.delete(key); // Remove expired cache entry
  }
  return null;
};

// Add lesson to cache
const cacheLesson = (key: string, lesson: Lesson): void => {
  lessonCache.set(key, {
    lesson,
    timestamp: Date.now()
  });
};

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

    // Initialize AI providers with default config
    const gptProvider = new GPTProvider({
      ...defaultConfig,
      model: input.difficulty === 'advanced' ? 'gpt-4' : 'gpt-3.5-turbo'
    });

    const geminiProvider = new GeminiProvider({
      ...defaultConfig,
      model: 'gemini-pro'
    });

    try {
      // Generate lesson with primary provider (GPT)
      log.info('Generating lesson with GPT', { input });
      const gptResponse = await gptProvider.generateLesson(input);

      // If visual content is requested, enhance with Gemini
      if (input.additionalInstructions?.includes('visual')) {
        log.info('Enhancing lesson with visual content from Gemini');
        const geminiResponse = await geminiProvider.generateLesson(input);
        
        // Merge visual resources from Gemini into GPT response
        const visualResources = geminiResponse.data.resources.filter(r => 
          r.type === 'video' || r.type === 'document'
        );
        
        gptResponse.data.resources = [
          ...gptResponse.data.resources,
          ...visualResources
        ];
      }

      // Validate generated content
      const validationResponse = await gptProvider.validateContent(
        JSON.stringify(gptResponse.data)
      );

      if (!validationResponse.data.isAppropriate) {
        log.warn('Generated content failed validation', {
          flags: validationResponse.data.flags,
          suggestions: validationResponse.data.suggestions
        });
        
        res.status(422).json({
          status: 'error',
          message: 'Generated content failed validation checks',
          details: {
            flags: validationResponse.data.flags,
            suggestions: validationResponse.data.suggestions
          }
        });
        return;
      }

      // Save the enhanced lesson
      const userId = (req as any).user?.id; // Type assertion for auth middleware
      if (!userId) {
        throw new Error('User ID not found in request');
      }

      const lesson = await LessonService.createLesson(userId, {
        ...gptResponse.data,
        metadata: {
          ...gptResponse.data.metadata,
          generatedBy: gptResponse.model,
          generatedAt: gptResponse.generatedAt.toISOString(),
          version: '1.0.0',
          isAIGenerated: true
        }
      });

    res.status(200).json({
      status: 'success',
      lesson
    });
    } catch (error) {
      console.error('Error in lesson generation controller:', error);
      
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: error instanceof Error && 'code' in error ? (error as { code: string }).code : 'UNKNOWN_ERROR'
      });
    }
  } catch (error) {
    log.error('Error in lesson generation controller:', { error });
    
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      code: error instanceof Error && 'code' in error ? (error as { code: string }).code : 'UNKNOWN_ERROR'
    });
  }
};

/**
 * Get a lesson by ID
 */
export const getLessonById = async (req: Request, res: Response): Promise<void> => {
  try {
    const lessonId = req.params.id;

    // Try cache first
    const cached = checkCache(lessonId);
    if (cached) {
      res.status(200).json({
        status: 'success',
        lesson: cached,
        cached: true
      });
      return;
    }

    const lesson = await LessonService.getLessonById(lessonId);
    cacheLesson(lessonId, lesson);

    // Update progress if user is authenticated
    const userId = (req as any).user?.id;
    if (userId) {
      await LessonService.updateProgress(userId, lessonId, {
        lastAccessedAt: new Date()
      });
    }

    res.status(200).json({
      status: 'success',
      lesson
    });
  } catch (error) {
    log.error('Error getting lesson:', { error, lessonId: req.params.id });
    
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
    const filters = {
      subject: req.query.subject as string,
      difficulty: req.query.difficulty as 'beginner' | 'intermediate' | 'advanced',
      status: req.query.status as 'draft' | 'published' | 'archived',
      authorId: (req as any).user?.id
    };

    const pagination: PaginationParams = {
      page: parseInt(req.query.page as string || '1', 10),
      limit: parseInt(req.query.limit as string || '10', 10)
    };

    // Generate cache key based on filters and pagination
    const cacheKey = `${JSON.stringify(filters)}-${pagination.page}-${pagination.limit}`;
    
    // Try cache first
    const cached = await cacheManager.getLessonsList(cacheKey);
    if (cached) {
      res.status(200).json({
        status: 'success',
        count: cached.length,
        page: pagination.page,
        limit: pagination.limit,
        lessons: cached,
        cached: true
      });
      return;
    }

    // Get from database with pagination
    const lessons = await LessonService.listLessons(filters, pagination);
    
    // Cache results
    await cacheManager.setLessonsList(cacheKey, lessons.items);

    res.status(200).json({
      status: 'success',
      count: lessons.items.length,
      total: lessons.total,
      page: lessons.page,
      limit: lessons.limit,
      lessons: lessons.items
    });
  } catch (error) {
    log.error('Error listing lessons:', { error, filters: req.query });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve lessons'
    });
  }
};

/**
 * Get lesson progress for current user
 */
export const getLessonProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const lessonId = req.params.id;
    const progress = await LessonService.getProgress(userId, lessonId);

    if (!progress) {
      res.status(404).json({
        status: 'error',
        message: 'No progress found for this lesson'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      progress
    });
  } catch (error) {
    log.error('Error getting lesson progress:', { 
      error, 
      lessonId: req.params.id,
      userId: (req as any).user?.id 
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve lesson progress'
    });
  }
};

/**
 * Update lesson progress
 */
export const updateLessonProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const lessonId = req.params.id;
    const progressData = req.body;

    const progress = await LessonService.updateProgress(userId, lessonId, progressData);

    res.status(200).json({
      status: 'success',
      progress
    });
  } catch (error) {
    log.error('Error updating lesson progress:', { 
      error, 
      lessonId: req.params.id,
      userId: (req as any).user?.id,
      data: req.body 
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update lesson progress'
    });
  }
};