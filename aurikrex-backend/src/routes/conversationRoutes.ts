/**
 * Conversation Routes
 * 
 * API routes for conversation and chat message operations:
 * - POST /api/conversations - Create a new conversation
 * - GET /api/conversations - Get all user conversations
 * - GET /api/conversations/:id - Get a conversation with messages
 * - GET /api/conversations/:id/messages - Get messages for a conversation
 * - POST /api/conversations/:id/message - Send a message and get AI response
 * - PUT /api/conversations/:id - Update conversation (title, topic)
 * - DELETE /api/conversations/:id - Delete a conversation
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { 
  createConversation,
  getConversations,
  getConversation,
  getConversationMessages,
  sendMessageInConversation,
  updateConversation,
  deleteConversation,
} from '../controllers/conversationController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/conversations
 * Create a new conversation
 */
router.post(
  '/',
  [
    body('title')
      .optional()
      .isString()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('topic')
      .optional()
      .isString()
      .isLength({ max: 100 })
      .withMessage('Topic must be at most 100 characters'),
    body('userPreferences')
      .optional()
      .isObject()
      .withMessage('userPreferences must be an object'),
  ],
  validateRequest,
  createConversation
);

/**
 * GET /api/conversations
 * Get all conversations for the current user
 */
router.get(
  '/',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
    query('skip')
      .optional()
      .isInt({ min: 0 })
      .withMessage('skip must be a non-negative integer'),
  ],
  validateRequest,
  getConversations
);

/**
 * GET /api/conversations/:id
 * Get a conversation with its messages
 */
router.get(
  '/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid conversation ID'),
    query('messageLimit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('messageLimit must be between 1 and 100'),
  ],
  validateRequest,
  getConversation
);

/**
 * GET /api/conversations/:id/messages
 * Get messages for a conversation
 */
router.get(
  '/:id/messages',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid conversation ID'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
    query('before')
      .optional()
      .isISO8601()
      .withMessage('before must be a valid ISO 8601 date'),
  ],
  validateRequest,
  getConversationMessages
);

/**
 * POST /api/conversations/:id/message
 * Send a message in a conversation and get AI response
 */
router.post(
  '/:id/message',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid conversation ID'),
    body('message')
      .notEmpty()
      .withMessage('message is required')
      .isString()
      .withMessage('message must be a string')
      .isLength({ min: 1, max: 10000 })
      .withMessage('message must be between 1 and 10000 characters'),
    body('requestType')
      .optional()
      .isIn(['teach', 'question', 'hint', 'review', 'explanation'])
      .withMessage('requestType must be one of: teach, question, hint, review, explanation'),
  ],
  validateRequest,
  sendMessageInConversation
);

/**
 * PUT /api/conversations/:id
 * Update a conversation (title, topic)
 */
router.put(
  '/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid conversation ID'),
    body('title')
      .optional()
      .isString()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('topic')
      .optional()
      .isString()
      .isLength({ max: 100 })
      .withMessage('Topic must be at most 100 characters'),
  ],
  validateRequest,
  updateConversation
);

/**
 * DELETE /api/conversations/:id
 * Delete a conversation and all its messages
 */
router.delete(
  '/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid conversation ID'),
  ],
  validateRequest,
  deleteConversation
);

export default router;
