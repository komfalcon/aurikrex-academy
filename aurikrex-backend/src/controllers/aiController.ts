/**
 * AI Controller
 * 
 * Handles AI-related HTTP requests for Aurikrex Academy.
 * This controller acts as the bridge between the frontend and FalkeAI backend.
 * 
 * Endpoints:
 * - POST /api/ai/chat - Send a chat message to FalkeAI
 * 
 * Note: Input validation is handled by express-validator middleware in aiRoutes.ts
 */

import { Request, Response } from 'express';
import { log } from '../utils/logger.js';
import { falkeAIService } from '../services/FalkeAIService.js';
import { FalkeAIChatRequest } from '../types/ai.types.js';

/**
 * POST /api/ai/chat
 * 
 * Send a chat message to FalkeAI and receive a response.
 * Input validation is handled by express-validator middleware.
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
    // Request body is already validated by express-validator middleware
    const { message, context } = req.body as FalkeAIChatRequest;

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
