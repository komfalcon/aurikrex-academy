import { defaultConfig } from '../services/BaseAIService.js';
import { GPTProvider } from '../services/GPTProvider.js';
import { GeminiProvider } from '../services/GeminiProvider.js';
import LessonService from '../services/LessonService.js';
import { validateSchema } from '../utils/validation.js';
import { ValidationError } from '../utils/errors.js';
import { lessonInputSchema } from '../utils/schemas.js';
import { log } from '../utils/logger.js';
// Cache for storing recently generated lessons
const lessonCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
// Check cache and return if lesson exists
const checkCache = (key) => {
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
const cacheLesson = (key, lesson) => {
    lessonCache.set(key, {
        lesson,
        timestamp: Date.now()
    });
};
/**
 * Generate a new lesson
 */
export const generateLesson = async (req, res) => {
    try {
        const input = {
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
        }
        catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({
                    status: 'error',
                    message: 'Invalid input',
                    errors: error.details?.errors || ['Validation failed']
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
                const visualResources = geminiResponse.data.resources.filter(r => r.type === 'video' || r.type === 'document');
                gptResponse.data.resources = [
                    ...gptResponse.data.resources,
                    ...visualResources
                ];
            }
            // Validate generated content
            const validationResponse = await gptProvider.validateContent(JSON.stringify(gptResponse.data));
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
            const userId = req.user?.id; // Type assertion for auth middleware
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
        }
        catch (error) {
            console.error('Error in lesson generation controller:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                code: error instanceof Error && 'code' in error ? error.code : 'UNKNOWN_ERROR'
            });
        }
    }
    catch (error) {
        log.error('Error in lesson generation controller:', { error });
        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            code: error instanceof Error && 'code' in error ? error.code : 'UNKNOWN_ERROR'
        });
    }
};
/**
 * Get a lesson by ID
 */
export const getLessonById = async (req, res) => {
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
        const userId = req.user?.id;
        if (userId) {
            await LessonService.updateProgress(userId, lessonId, {
                lastAccessedAt: new Date()
            });
        }
        res.status(200).json({
            status: 'success',
            lesson
        });
    }
    catch (error) {
        log.error('Error getting lesson:', { error, lessonId: req.params.id });
        res.status(404).json({
            status: 'error',
            message: 'Lesson not found'
        });
    }
};
/**
 * List lessons with filters
 */
export const listLessons = async (req, res) => {
    try {
        const filters = {
            subject: req.query.subject,
            difficulty: req.query.difficulty,
            status: req.query.status,
            authorId: req.user?.id
        };
        const lessons = await LessonService.listLessons(filters);
        // Cache individual lessons
        lessons.forEach(lesson => {
            cacheLesson(lesson.id, lesson);
        });
        res.status(200).json({
            status: 'success',
            count: lessons.length,
            lessons
        });
    }
    catch (error) {
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
export const getLessonProgress = async (req, res) => {
    try {
        const userId = req.user?.id;
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
    }
    catch (error) {
        log.error('Error getting lesson progress:', {
            error,
            lessonId: req.params.id,
            userId: req.user?.id
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
export const updateLessonProgress = async (req, res) => {
    try {
        const userId = req.user?.id;
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
    }
    catch (error) {
        log.error('Error updating lesson progress:', {
            error,
            lessonId: req.params.id,
            userId: req.user?.id,
            data: req.body
        });
        res.status(500).json({
            status: 'error',
            message: 'Failed to update lesson progress'
        });
    }
};
//# sourceMappingURL=lessonController.js.map