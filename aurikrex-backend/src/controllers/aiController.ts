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
import { falkeAIService, FalkeAIError, FalkeAIErrorCode } from '../services/FalkeAIService.js';
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
  const requestTimestamp = new Date().toISOString();
  
  try {
    // Request body is already validated by express-validator middleware
    const { message, context } = req.body as FalkeAIChatRequest;

    // Log incoming request with detailed info for debugging
    log.info('📨 AI Chat Request received', {
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      messageLength: message.length,
      userId: context.userId,
      username: context.username,
      page: context.page,
      course: context.course || 'N/A',
      timestamp: requestTimestamp,
    });

    // Check if FalkeAI service is configured
    if (!falkeAIService.isConfigured()) {
      log.error('❌ FalkeAI service not configured - missing FALKEAI_API_BASE_URL or FALKEAI_API_KEY');
      res.status(503).json({
        status: 'error',
        message: 'AI service is currently unavailable. Please try again later.',
      });
      return;
    }

    log.info('🔄 Calling FalkeAI Service', {
      baseUrl: process.env.FALKEAI_API_BASE_URL ? 'configured' : 'missing',
      apiKey: process.env.FALKEAI_API_KEY ? 'configured' : 'missing',
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

    log.info('✅ FalkeAI Response received successfully', {
      page: context.page,
      userId: context.userId,
      replyLength: response.reply.length,
      replyPreview: response.reply.substring(0, 100) + (response.reply.length > 100 ? '...' : ''),
      timestamp: response.timestamp,
    });

    // Return the response
    res.status(200).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log detailed error information for debugging
    log.error('❌ AI chat request failed', {
      error: errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorCode: error instanceof FalkeAIError ? error.errorCode : undefined,
      statusCode: error instanceof FalkeAIError ? error.statusCode : undefined,
      stack: errorStack,
      userId: req.body?.context?.userId,
      page: req.body?.context?.page,
      requestTimestamp,
      falkeAIBaseUrl: process.env.FALKEAI_API_BASE_URL || 'NOT SET',
    });

    // Determine appropriate status code and message using error codes
    let statusCode = 500;
    let userMessage = errorMessage;
    
    if (error instanceof FalkeAIError) {
      // Use structured error codes for reliable categorization
      switch (error.errorCode) {
        case FalkeAIErrorCode.TIMEOUT:
          statusCode = 504;
          userMessage = 'AI service request timed out. Please try again.';
          break;
        case FalkeAIErrorCode.NETWORK_ERROR:
          statusCode = 502;
          userMessage = 'Unable to reach AI service. Please try again later.';
          break;
        case FalkeAIErrorCode.SERVICE_UNAVAILABLE:
          statusCode = 503;
          userMessage = 'AI service is temporarily unavailable. Please try again later.';
          break;
        case FalkeAIErrorCode.AUTHENTICATION_ERROR:
          statusCode = 502;
          userMessage = 'AI service authentication failed. Please contact support.';
          break;
        case FalkeAIErrorCode.INVALID_RESPONSE:
          statusCode = 502;
          userMessage = 'AI service returned an invalid response. Please try again.';
          break;
        default:
          // Use HTTP status code from FalkeAIError if available
          if (error.statusCode) {
            statusCode = error.statusCode >= 500 ? 502 : error.statusCode;
          }
          break;
      }
    }

    // Return clean error message (no stack traces to frontend)
    res.status(statusCode).json({
      status: 'error',
      message: userMessage,
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
