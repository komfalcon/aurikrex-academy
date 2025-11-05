import { Router } from 'express';
import { body, param } from 'express-validator';
import { sanitizeAndValidate } from '../middleware/sanitization.middleware.js';
import { AnalyticsService } from '../services/AnalyticsService.js';
import { log } from '../utils/logger.js';
const router = Router();
/**
 * @route GET /api/analytics/lessons/:id
 * @description Get analytics for a specific lesson
 * @access Private
 */
router.get('/lessons/:id', [
    param('id').trim().notEmpty(),
    sanitizeAndValidate,
    async (req, res) => {
        try {
            const analytics = await AnalyticsService.getLessonAnalytics(req.params.id);
            if (!analytics) {
                res.status(404).json({
                    status: 'error',
                    message: 'Analytics not found'
                });
                return;
            }
            res.status(200).json({
                status: 'success',
                analytics
            });
        }
        catch (error) {
            log.error('Error getting lesson analytics', { error, lessonId: req.params.id });
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve analytics'
            });
        }
    }
]);
router.get('/engagement/:lessonId', [
    param('lessonId').trim().notEmpty(),
    sanitizeAndValidate,
    async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    status: 'error',
                    message: 'Authentication required'
                });
                return;
            }
            const engagement = await AnalyticsService.getUserEngagement(userId, req.params.lessonId);
            if (!engagement) {
                res.status(404).json({
                    status: 'error',
                    message: 'Engagement data not found'
                });
                return;
            }
            res.status(200).json({
                status: 'success',
                engagement
            });
        }
        catch (error) {
            log.error('Error getting user engagement', {
                error,
                lessonId: req.params.lessonId,
                userId: req.user?.id
            });
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve engagement data'
            });
        }
    }
]);
router.post('/exercises/:lessonId/:exerciseId', [
    param('lessonId').trim().notEmpty(),
    param('exerciseId').trim().notEmpty(),
    body('correct').isBoolean(),
    body('timeSpent').isInt({ min: 0 }),
    body('attempts').isInt({ min: 1 }),
    sanitizeAndValidate,
    async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    status: 'error',
                    message: 'Authentication required'
                });
                return;
            }
            await AnalyticsService.trackExercise(req.params.lessonId, userId, req.params.exerciseId, {
                correct: req.body.correct,
                timeSpent: req.body.timeSpent,
                attempts: req.body.attempts
            });
            res.status(200).json({
                status: 'success',
                message: 'Exercise attempt tracked'
            });
        }
        catch (error) {
            log.error('Error tracking exercise attempt', {
                error,
                lessonId: req.params.lessonId,
                exerciseId: req.params.exerciseId,
                userId: req.user?.id
            });
            res.status(500).json({
                status: 'error',
                message: 'Failed to track exercise attempt'
            });
        }
    }
]);
export default router;
//# sourceMappingURL=analyticsRoutes.js.map