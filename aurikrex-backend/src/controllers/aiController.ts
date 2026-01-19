/**
 * AI Controller
 * 
 * Handles AI-related HTTP requests for Aurikrex Academy.
 * This controller acts as the bridge between the frontend and FalkeAI backend.
 * 
 * Endpoints:
 * - POST /api/ai/chat - Send a chat message to FalkeAI
 */

import { Request, Response } from 'express';
import { log } from '../utils/logger.js';
import { falkeAIService } from '../services/FalkeAIService.js';
import { FalkeAIChatRequest, FalkeAIChatContext } from '../types/ai.types.js';

/**
 * Valid page values for the chat context
 */
const VALID_PAGES: FalkeAIChatContext['page'][] = [
  'Smart Lessons',
  'Assignment',
  'Dashboard',
  'Ask FalkeAI',
];

/**
 * POST /api/ai/chat
 * 
 * Send a chat message to FalkeAI and receive a response.
 * 
 * Request body:
 * {
 *   "message": "string",
 *   "context": {
 *     "page": "Smart Lessons | Assignment | Dashboard | Ask FalkeAI",
 *     "course": "optional string",
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
export const sendChatMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, context } = req.body as FalkeAIChatRequest;

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'Message is required and must be a non-empty string',
      });
      return;
    }

    // Validate context
    if (!context || typeof context !== 'object') {
      res.status(400).json({
        status: 'error',
        message: 'Context object is required',
      });
      return;
    }

    // Validate context.page
    if (!context.page || !VALID_PAGES.includes(context.page)) {
      res.status(400).json({
        status: 'error',
        message: `Invalid page value. Must be one of: ${VALID_PAGES.join(', ')}`,
      });
      return;
    }

    // Validate context.username
    if (!context.username || typeof context.username !== 'string') {
      res.status(400).json({
        status: 'error',
        message: 'Context username is required',
      });
      return;
    }

    // Validate context.userId
    if (!context.userId || typeof context.userId !== 'string') {
      res.status(400).json({
        status: 'error',
        message: 'Context userId is required',
      });
      return;
    }

    // Check if FalkeAI service is configured
    if (!falkeAIService.isConfigured()) {
      log.error('❌ FalkeAI service not configured');
      res.status(503).json({
        status: 'error',
        message: 'AI service is currently unavailable',
      });
      return;
    }

    log.info('💬 Processing AI chat request', {
      page: context.page,
      userId: context.userId,
      messageLength: message.length,
    });

    // Build the request
    const chatRequest: FalkeAIChatRequest = {
      message: message.trim(),
      context: {
        page: context.page,
        course: context.course,
        username: context.username,
        userId: context.userId,
      },
    };

    // Send to FalkeAI and get response
    const response = await falkeAIService.sendChatMessage(chatRequest);

    log.info('✅ AI chat response sent', {
      page: context.page,
      userId: context.userId,
      replyLength: response.reply.length,
    });

    // Return the response
    res.status(200).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    log.error('❌ AI chat request failed', {
      error: errorMessage,
      userId: req.body?.context?.userId,
      page: req.body?.context?.page,
    });

    // Return clean error message (no stack traces)
    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};

/**
 * GET /api/ai/health
 * 
 * Check the health status of the AI service.
 * Useful for monitoring and debugging.
 */
export const getAIHealth = async (_req: Request, res: Response): Promise<void> => {
  const isConfigured = falkeAIService.isConfigured();

  res.status(200).json({
    status: isConfigured ? 'ok' : 'unconfigured',
    service: 'FalkeAI',
    timestamp: new Date().toISOString(),
    message: isConfigured 
      ? 'AI service is properly configured' 
      : 'AI service is not configured. Set FALKEAI_API_BASE_URL and FALKEAI_API_KEY.',
  });
};
