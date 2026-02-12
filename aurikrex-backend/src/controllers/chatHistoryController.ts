/**
 * Chat History Controller
 * 
 * Handles HTTP requests for chat history operations.
 * Provides endpoints for saving, retrieving, and managing chat sessions.
 * 
 * Endpoints:
 * - POST /chat/save - Save a message to a session
 * - GET /chat/history/:userId - Get all sessions for a user
 * - GET /chat/session/:sessionId - Get a specific session with messages
 * - DELETE /chat/session/:sessionId - Delete a chat session
 * 
 * All endpoints require authentication via JWT token.
 * 
 * @module chatHistoryController
 */

import { Request, Response } from 'express';
import { log } from '../utils/logger.js';
import { ChatHistoryModel } from '../models/ChatHistory.model.js';
import { UserModel } from '../models/User.model.js';

/**
 * POST /api/chat/save
 * 
 * Save a message exchange to chat history.
 * Creates a new session if sessionId is not provided or not found.
 * 
 * Request body:
 * {
 *   "sessionId": "optional - existing session ID",
 *   "userMessage": "User's message content",
 *   "aiResponse": "AI's response content",
 *   "page": "Smart Lessons | Assignment | Dashboard | Ask FalkeAI",
 *   "course": "optional - course context",
 *   "metadata": "optional - AI response metadata"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "session": { session data },
 *   "isNewSession": boolean
 * }
 */
export const saveMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    const { sessionId, userMessage, aiResponse, page, course, metadata } = req.body;

    log.info('📥 Save message request received', {
      userId,
      sessionId: sessionId || '(new session)',
      page,
      hasAiResponse: !!aiResponse,
    });

    // Save the message exchange
    const result = await ChatHistoryModel.saveMessageExchange({
      userId,
      sessionId,
      userMessage,
      aiResponse,
      page,
      course,
      metadata,
    });

    log.info('✅ Message exchange saved successfully', {
      sessionId: result.session.sessionId,
      isNewSession: result.isNewSession,
      messageCount: result.session.messageCount,
    });

    res.status(200).json({
      success: true,
      session: {
        sessionId: result.session.sessionId,
        title: result.session.title,
        messageCount: result.session.messageCount,
        page: result.session.page,
        isActive: result.session.isActive,
        createdAt: result.session.createdAt,
        updatedAt: result.session.updatedAt,
      },
      isNewSession: result.isNewSession,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to save message';
    
    log.error('❌ Error saving message', {
      error: errorMessage,
      userId: req.user?.userId,
    });

    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};

/**
 * GET /api/chat/history/:userId
 * 
 * Get all chat sessions for a user with pagination.
 * Returns session summaries without full message content for efficiency.
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 * - isActive: Filter by active status (optional)
 * - pageFilter: Filter by page context (optional)
 * 
 * Response:
 * {
 *   "success": true,
 *   "sessions": [...],
 *   "pagination": { page, limit, total, hasMore }
 * }
 */
export const getUserChatHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestingUserId = req.user?.userId;
    const targetUserId = req.params.userId;

    if (!requestingUserId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    // Users can only access their own chat history
    if (requestingUserId !== targetUserId) {
      log.warn('⚠️ Unauthorized chat history access attempt', {
        requestingUserId,
        targetUserId,
      });

      res.status(403).json({
        status: 'error',
        message: 'You can only access your own chat history',
      });
      return;
    }

    // Verify user exists
    const user = await UserModel.findById(targetUserId);
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const isActive = req.query.isActive !== undefined
      ? req.query.isActive === 'true'
      : undefined;
    const pageFilter = req.query.pageFilter as typeof req.body.page | undefined;

    log.info('📋 Getting user chat history', {
      userId: targetUserId,
      page,
      limit,
      isActive,
      pageFilter,
    });

    const result = await ChatHistoryModel.getUserSessions(targetUserId, {
      page,
      limit,
      isActive,
      pageFilter,
    });

    log.info('✅ Chat history retrieved', {
      userId: targetUserId,
      sessionsReturned: result.data.length,
      totalSessions: result.total,
    });

    res.status(200).json({
      success: true,
      sessions: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get chat history';
    
    log.error('❌ Error getting chat history', {
      error: errorMessage,
      userId: req.params.userId,
    });

    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};

/**
 * GET /api/chat/session/:sessionId
 * 
 * Get a specific chat session with all messages.
 * Supports pagination for large message histories.
 * 
 * Query parameters:
 * - limit: Messages per page (default: 50, max: 100)
 * - skip: Number of messages to skip (for pagination)
 * 
 * Response:
 * {
 *   "success": true,
 *   "session": { session data with messages },
 *   "pagination": { page, limit, total, hasMore }
 * }
 */
export const getSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const sessionId = req.params.sessionId as string;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    log.info('📋 Getting chat session', {
      sessionId,
      userId,
    });

    const session = await ChatHistoryModel.getSession(sessionId);

    if (!session) {
      res.status(404).json({
        status: 'error',
        message: 'Session not found',
      });
      return;
    }

    // Verify user owns the session
    if (session.userId !== userId) {
      log.warn('⚠️ Unauthorized session access attempt', {
        sessionId,
        requestingUserId: userId,
        sessionOwnerId: session.userId,
      });

      res.status(403).json({
        status: 'error',
        message: 'You can only access your own chat sessions',
      });
      return;
    }

    // Parse pagination parameters for messages
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const skip = parseInt(req.query.skip as string) || 0;

    // Get paginated messages if session has many messages
    let messages = session.messages;
    let hasMore = false;
    let total = session.messageCount;

    if (session.messageCount > limit) {
      const messageResult = await ChatHistoryModel.getSessionMessages(sessionId, {
        limit,
        skip,
      });
      messages = messageResult.data;
      hasMore = messageResult.hasMore;
      total = messageResult.total;
    }

    log.info('✅ Session retrieved', {
      sessionId,
      messagesReturned: messages.length,
      totalMessages: total,
    });

    res.status(200).json({
      success: true,
      session: {
        _id: session._id,
        sessionId: session.sessionId,
        userId: session.userId,
        title: session.title,
        page: session.page,
        course: session.course,
        isActive: session.isActive,
        messageCount: session.messageCount,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        lastMessageAt: session.lastMessageAt,
        messages,
      },
      pagination: {
        skip,
        limit,
        total,
        hasMore,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get session';
    
    log.error('❌ Error getting session', {
      error: errorMessage,
      sessionId: req.params.sessionId,
    });

    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};

/**
 * GET /api/chat/session/:sessionId/context
 * 
 * Get recent messages for AI context (formatted for conversation history).
 * Returns messages in a format suitable for AI model input.
 * 
 * Query parameters:
 * - maxMessages: Maximum messages to return (default: 20, max: 50)
 * 
 * Response:
 * {
 *   "success": true,
 *   "context": {
 *     "sessionId": string,
 *     "messages": [{ role, content, timestamp }],
 *     "totalMessages": number
 *   }
 * }
 */
export const getSessionContext = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const sessionId = req.params.sessionId as string;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    // First verify session ownership
    const session = await ChatHistoryModel.getSession(sessionId);

    if (!session) {
      res.status(404).json({
        status: 'error',
        message: 'Session not found',
      });
      return;
    }

    if (session.userId !== userId) {
      res.status(403).json({
        status: 'error',
        message: 'You can only access your own chat sessions',
      });
      return;
    }

    const maxMessages = Math.min(parseInt(req.query.maxMessages as string) || 20, 50);

    log.info('📋 Getting session context for AI', {
      sessionId,
      userId,
      maxMessages,
    });

    const context = await ChatHistoryModel.getAIContext(sessionId, maxMessages);

    log.info('✅ Session context retrieved', {
      sessionId,
      messagesReturned: context.messages.length,
    });

    res.status(200).json({
      success: true,
      context,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get session context';
    
    log.error('❌ Error getting session context', {
      error: errorMessage,
      sessionId: req.params.sessionId,
    });

    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};

/**
 * DELETE /api/chat/session/:sessionId
 * 
 * Delete a chat session permanently.
 * User can only delete their own sessions.
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Session deleted successfully"
 * }
 */
export const deleteSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const sessionId = req.params.sessionId as string;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    log.info('🗑️ Delete session request', {
      sessionId,
      userId,
    });

    const deleted = await ChatHistoryModel.deleteSession(sessionId, userId);

    if (!deleted) {
      res.status(404).json({
        status: 'error',
        message: 'Session not found or you do not have permission to delete it',
      });
      return;
    }

    log.info('✅ Session deleted successfully', {
      sessionId,
      userId,
    });

    res.status(200).json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete session';
    
    log.error('❌ Error deleting session', {
      error: errorMessage,
      sessionId: req.params.sessionId,
    });

    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};

/**
 * POST /api/chat/session/:sessionId/clear
 * 
 * Clear all messages from a session while keeping the session.
 * Resets the session to a clean state.
 * 
 * Response:
 * {
 *   "success": true,
 *   "session": { updated session data }
 * }
 */
export const clearSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const sessionId = req.params.sessionId as string;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    log.info('🧹 Clear session request', {
      sessionId,
      userId,
    });

    const session = await ChatHistoryModel.clearSessionMessages(sessionId, userId);

    if (!session) {
      res.status(404).json({
        status: 'error',
        message: 'Session not found or you do not have permission to clear it',
      });
      return;
    }

    log.info('✅ Session cleared successfully', {
      sessionId,
      userId,
    });

    res.status(200).json({
      success: true,
      session: {
        sessionId: session.sessionId,
        title: session.title,
        messageCount: session.messageCount,
        updatedAt: session.updatedAt,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to clear session';
    
    log.error('❌ Error clearing session', {
      error: errorMessage,
      sessionId: req.params.sessionId,
    });

    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};

/**
 * POST /api/chat/session/create
 * 
 * Create a new chat session without any messages.
 * Useful for initializing a session before the user sends their first message.
 * 
 * Request body:
 * {
 *   "page": "Smart Lessons | Assignment | Dashboard | Ask FalkeAI",
 *   "course": "optional - course context",
 *   "title": "optional - custom title"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "session": { session data }
 * }
 */
export const createSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    const { page, course, title } = req.body;

    log.info('📝 Create session request', {
      userId,
      page,
      course,
    });

    const session = await ChatHistoryModel.createSession({
      userId,
      page,
      course,
      title,
    });

    log.info('✅ Session created successfully', {
      sessionId: session.sessionId,
      userId,
    });

    res.status(201).json({
      success: true,
      session: {
        sessionId: session.sessionId,
        title: session.title,
        page: session.page,
        course: session.course,
        isActive: session.isActive,
        messageCount: session.messageCount,
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
    
    log.error('❌ Error creating session', {
      error: errorMessage,
      userId: req.user?.userId,
    });

    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};

/**
 * GET /api/chat/stats
 * 
 * Get chat statistics for the authenticated user.
 * 
 * Response:
 * {
 *   "success": true,
 *   "stats": {
 *     "totalSessions": number,
 *     "activeSessions": number,
 *     "totalMessages": number,
 *     "lastActivityAt": Date | null,
 *     "sessionsByPage": { page: count }
 *   }
 * }
 */
export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    log.info('📊 Get user chat stats', { userId });

    const stats = await ChatHistoryModel.getUserStats(userId);

    log.info('✅ User stats retrieved', {
      userId,
      totalSessions: stats.totalSessions,
      totalMessages: stats.totalMessages,
    });

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get stats';
    
    log.error('❌ Error getting user stats', {
      error: errorMessage,
      userId: req.user?.userId,
    });

    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};
