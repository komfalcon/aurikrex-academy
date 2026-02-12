/**
 * Chat History Routes
 * 
 * Routes for managing persistent chat history for FalkeAI.
 * All routes require authentication via JWT token.
 * 
 * Endpoints:
 * - POST /api/chat/save - Save a message exchange
 * - POST /api/chat/session/create - Create a new empty session
 * - GET /api/chat/history/:userId - Get all sessions for a user
 * - GET /api/chat/session/:sessionId - Get a specific session with messages
 * - GET /api/chat/session/:sessionId/context - Get AI context from session
 * - DELETE /api/chat/session/:sessionId - Delete a session
 * - POST /api/chat/session/:sessionId/clear - Clear session messages
 * - GET /api/chat/stats - Get user's chat statistics
 * 
 * @module chatHistoryRoutes
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  saveMessage,
  getUserChatHistory,
  getSession,
  getSessionContext,
  deleteSession,
  clearSession,
  createSession,
  getUserStats,
} from '../controllers/chatHistoryController.js';

const router = Router();

// ============================================
// Save Message Exchange
// ============================================

/**
 * @route   POST /api/chat/save
 * @desc    Save a user message and AI response to chat history
 * @access  Private (requires authentication)
 */
router.post(
  '/save',
  authenticate,
  [
    body('userMessage')
      .notEmpty()
      .withMessage('User message is required')
      .isString()
      .withMessage('User message must be a string')
      .trim()
      .isLength({ min: 1, max: 50000 })
      .withMessage('User message must be between 1 and 50000 characters'),
    body('aiResponse')
      .notEmpty()
      .withMessage('AI response is required')
      .isString()
      .withMessage('AI response must be a string')
      .trim()
      .isLength({ min: 1, max: 100000 })
      .withMessage('AI response must be between 1 and 100000 characters'),
    body('page')
      .notEmpty()
      .withMessage('Page context is required')
      .isIn(['Smart Lessons', 'Assignment', 'Dashboard', 'Ask FalkeAI'])
      .withMessage('Invalid page value'),
    body('sessionId')
      .optional()
      .isString()
      .withMessage('Session ID must be a string'),
    body('course')
      .optional()
      .isString()
      .withMessage('Course must be a string'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
  ],
  validateRequest,
  saveMessage
);

// ============================================
// Create New Session
// ============================================

/**
 * @route   POST /api/chat/session/create
 * @desc    Create a new empty chat session
 * @access  Private (requires authentication)
 */
router.post(
  '/session/create',
  authenticate,
  [
    body('page')
      .notEmpty()
      .withMessage('Page context is required')
      .isIn(['Smart Lessons', 'Assignment', 'Dashboard', 'Ask FalkeAI'])
      .withMessage('Invalid page value'),
    body('course')
      .optional()
      .isString()
      .withMessage('Course must be a string'),
    body('title')
      .optional()
      .isString()
      .withMessage('Title must be a string')
      .isLength({ max: 100 })
      .withMessage('Title must be at most 100 characters'),
  ],
  validateRequest,
  createSession
);

// ============================================
// Get User Chat History
// ============================================

/**
 * @route   GET /api/chat/history/:userId
 * @desc    Get all chat sessions for a user
 * @access  Private (requires authentication, can only access own history)
 */
router.get(
  '/history/:userId',
  authenticate,
  [
    param('userId')
      .notEmpty()
      .withMessage('User ID is required')
      .isMongoId()
      .withMessage('Invalid user ID format'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('isActive')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('isActive must be true or false'),
    query('pageFilter')
      .optional()
      .isIn(['Smart Lessons', 'Assignment', 'Dashboard', 'Ask FalkeAI'])
      .withMessage('Invalid page filter value'),
  ],
  validateRequest,
  getUserChatHistory
);

// ============================================
// Get Specific Session
// ============================================

/**
 * @route   GET /api/chat/session/:sessionId
 * @desc    Get a specific chat session with messages
 * @access  Private (requires authentication, can only access own sessions)
 */
router.get(
  '/session/:sessionId',
  authenticate,
  [
    param('sessionId')
      .notEmpty()
      .withMessage('Session ID is required')
      .isString()
      .withMessage('Session ID must be a string'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('skip')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Skip must be a non-negative integer'),
  ],
  validateRequest,
  getSession
);

// ============================================
// Get Session Context for AI
// ============================================

/**
 * @route   GET /api/chat/session/:sessionId/context
 * @desc    Get recent messages formatted for AI context
 * @access  Private (requires authentication)
 */
router.get(
  '/session/:sessionId/context',
  authenticate,
  [
    param('sessionId')
      .notEmpty()
      .withMessage('Session ID is required')
      .isString()
      .withMessage('Session ID must be a string'),
    query('maxMessages')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('maxMessages must be between 1 and 50'),
  ],
  validateRequest,
  getSessionContext
);

// ============================================
// Delete Session
// ============================================

/**
 * @route   DELETE /api/chat/session/:sessionId
 * @desc    Delete a chat session permanently
 * @access  Private (requires authentication, can only delete own sessions)
 */
router.delete(
  '/session/:sessionId',
  authenticate,
  [
    param('sessionId')
      .notEmpty()
      .withMessage('Session ID is required')
      .isString()
      .withMessage('Session ID must be a string'),
  ],
  validateRequest,
  deleteSession
);

// ============================================
// Clear Session Messages
// ============================================

/**
 * @route   POST /api/chat/session/:sessionId/clear
 * @desc    Clear all messages from a session
 * @access  Private (requires authentication, can only clear own sessions)
 */
router.post(
  '/session/:sessionId/clear',
  authenticate,
  [
    param('sessionId')
      .notEmpty()
      .withMessage('Session ID is required')
      .isString()
      .withMessage('Session ID must be a string'),
  ],
  validateRequest,
  clearSession
);

// ============================================
// Get User Chat Stats
// ============================================

/**
 * @route   GET /api/chat/stats
 * @desc    Get chat statistics for the authenticated user
 * @access  Private (requires authentication)
 */
router.get(
  '/stats',
  authenticate,
  getUserStats
);

export default router;
