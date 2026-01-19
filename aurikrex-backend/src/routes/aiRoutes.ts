/**
 * AI Routes
 * 
 * Routes for AI-related functionality in Aurikrex Academy.
 * These routes provide a bridge between the frontend and the FalkeAI backend.
 * 
 * IMPORTANT:
 * - The frontend should never call FalkeAI directly
 * - All AI calls must go through these internal backend routes
 * - No model details or API keys are exposed to the frontend
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { sendChatMessage, getAIHealth } from '../controllers/aiController.js';

const router = Router();

// ============================================
// AI Chat Routes
// ============================================

/**
 * @route   POST /api/ai/chat
 * @desc    Send a chat message to FalkeAI and receive a response
 * @access  Private (requires authentication)
 * 
 * Request body:
 * {
 *   "message": "string",
 *   "context": {
 *     "page": "Smart Lessons | Assignment | Dashboard | Ask FalkeAI",
 *     "course": "optional",
 *     "username": "string",
 *     "userId": "string"
 *   }
 * }
 * 
 * Response:
 * {
 *   "reply": "FalkeAI response text",
 *   "timestamp": "ISO string"
 * }
 */
router.post(
  '/chat',
  authenticate,
  [
    body('message')
      .notEmpty()
      .withMessage('Message is required')
      .isString()
      .withMessage('Message must be a string')
      .trim()
      .isLength({ min: 1, max: 10000 })
      .withMessage('Message must be between 1 and 10000 characters'),
    body('context')
      .notEmpty()
      .withMessage('Context is required')
      .isObject()
      .withMessage('Context must be an object'),
    body('context.page')
      .notEmpty()
      .withMessage('Context page is required')
      .isIn(['Smart Lessons', 'Assignment', 'Dashboard', 'Ask FalkeAI'])
      .withMessage('Invalid page value'),
    body('context.username')
      .notEmpty()
      .withMessage('Context username is required')
      .isString()
      .withMessage('Context username must be a string'),
    body('context.userId')
      .notEmpty()
      .withMessage('Context userId is required')
      .isString()
      .withMessage('Context userId must be a string'),
    body('context.course')
      .optional()
      .isString()
      .withMessage('Context course must be a string'),
  ],
  validateRequest,
  sendChatMessage
);

// ============================================
// AI Health Check Route
// ============================================

/**
 * @route   GET /api/ai/health
 * @desc    Check the health status of the AI service
 * @access  Public
 */
router.get('/health', getAIHealth);

export default router;
