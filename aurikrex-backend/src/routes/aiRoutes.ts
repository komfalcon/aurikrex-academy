/**
 * AI Routes
 * 
 * Routes for AI-related functionality in Aurikrex Academy.
 * These routes provide a bridge between the frontend and AI backends.
 * 
 * Supported AI Providers:
 * - Primary: Google Gemini (free tier, 3 API keys load-balanced)
 * - Fallback: OpenAI (paid, 2 API keys load-balanced)
 * 
 * IMPORTANT:
 * - The frontend should never call AI providers directly
 * - All AI calls must go through these internal backend routes
 * - No model details or API keys are exposed to the frontend
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { sendChatMessage, sendEnhancedChatMessage, getAIHealth } from '../controllers/aiController.js';

const router = Router();

// ============================================
// AI Chat Routes
// ============================================

/**
 * @route   POST /api/ai/chat
 * @desc    Send a chat message to AI service (Gemini/OpenAI) and receive a response
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
 *   "reply": "AI response text",
 *   "timestamp": "ISO string",
 *   "provider": "gemini | openai",
 *   "model": "model name"
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
    body('conversationId')
      .optional()
      .isMongoId()
      .withMessage('conversationId must be a valid MongoDB ObjectId'),
  ],
  validateRequest,
  sendChatMessage
);

// ============================================
// Enhanced AI Chat Route (with Prompt Engineering)
// ============================================

/**
 * @route   POST /api/ai/chat/enhanced
 * @desc    Send an enhanced chat message with prompt engineering
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
 *   },
 *   "requestType": "teach | question | review | hint | explanation" (optional),
 *   "userLearningContext": { ... } (optional)
 * }
 * 
 * Response:
 * {
 *   "reply": "Refined AI response text",
 *   "timestamp": "ISO string",
 *   "provider": "openrouter | groq",
 *   "model": "model name",
 *   "requestType": "teach | question | review | hint | explanation",
 *   "refined": { raw, refined, formattedHtml, structure }
 * }
 */
router.post(
  '/chat/enhanced',
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
    body('requestType')
      .optional()
      .isIn(['teach', 'question', 'review', 'hint', 'explanation'])
      .withMessage('Invalid request type. Must be one of: teach, question, review, hint, explanation'),
    body('userLearningContext')
      .optional()
      .isObject()
      .withMessage('User learning context must be an object'),
  ],
  validateRequest,
  sendEnhancedChatMessage
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
