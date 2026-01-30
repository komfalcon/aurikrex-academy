/**
 * AI Controller
 * 
 * Handles AI-related HTTP requests for Aurikrex Academy.
 * This controller acts as the bridge between the frontend and AI backends.
 * 
 * Supported AI Providers:
 * - Primary: OpenRouter (4 FREE models with smart routing)
 *   - Simple → Arcee Trinity Mini (FAST)
 *   - Complex → Hermes 3 405B (REASONING)
 *   - Coding → Hermes 3 405B (CODING)
 *   - Balanced → Qwen3 Next 80B (BALANCED)
 * - Fallback: Groq API (if OpenRouter completely fails)
 *   - Uses: Mixtral 8x7B (free)
 * 
 * Endpoints:
 * - POST /api/ai/chat - Send a chat message to AI service
 * 
 * Note: Input validation is handled by express-validator middleware in aiRoutes.ts
 */

import { Request, Response } from 'express';
import { log } from '../utils/logger.js';
import { aiService, AIServiceError, AIErrorCode } from '../services/AIService.js';
import { AIChatRequest, EnhancedAIChatRequest, AIRequestType } from '../types/ai.types.js';
import { FalkeAIActivityLogger } from '../services/FalkeAIActivityLogger.js';
import { ResponseFormatterService } from '../services/ResponseFormatterService.js';
import { ConversationModel, ChatMessageModel } from '../models/Conversation.model.js';

/**
 * POST /api/ai/chat
 * 
 * Send a chat message to AI service and receive a response.
 * Tries OpenRouter first (free tier, smart routing), falls back to Groq if needed.
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
 *   "reply": "AI response text",
 *   "timestamp": "ISO string",
 *   "provider": "openrouter | groq",
 *   "model": "model name",
 *   "modelType": "fast | balanced | reasoning | coding | fallback"
 * }
 */
export const sendChatMessage = async (req: Request, res: Response): Promise<void> => {
  const requestTimestamp = new Date().toISOString();
  const startTime = Date.now();
  
  try {
    // Request body is already validated by express-validator middleware
    const { message, context, conversationId } = req.body as AIChatRequest & { conversationId?: string };

    // Log incoming request with detailed info for debugging
    log.info('📨 AI Chat Request received', {
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      messageLength: message.length,
      userId: context.userId,
      username: context.username,
      page: context.page,
      course: context.course || 'N/A',
      conversationId: conversationId || 'new',
      timestamp: requestTimestamp,
    });

    // Check if AI service is configured
    if (!aiService.isConfigured()) {
      log.error('❌ AI service not configured - no API keys available');
      res.status(503).json({
        status: 'error',
        message: 'AI service is currently unavailable. Please try again later.',
      });
      return;
    }

    // STEP 1: Get or create conversation
    let conversation;
    let isNewConversation = false;
    
    if (conversationId) {
      // Existing conversation
      conversation = await ConversationModel.findById(conversationId);
      if (!conversation) {
        res.status(404).json({ status: 'error', message: 'Conversation not found' });
        return;
      }
      // Authorization: verify conversation belongs to the requesting user
      if (conversation.userId !== context.userId) {
        res.status(403).json({ status: 'error', message: 'Not authorized to access this conversation' });
        return;
      }
    } else {
      // New conversation - create it
      // Sanitize title: remove newlines, trim whitespace, limit length
      const sanitizedTitle = message.replace(/[\r\n]+/g, ' ').trim();
      conversation = await ConversationModel.create({
        userId: context.userId,
        title: sanitizedTitle.length > 50 ? sanitizedTitle.substring(0, 47) + '...' : sanitizedTitle,
        topic: context.course || 'General',
      });
      isNewConversation = true;
    }

    // STEP 2: Fetch previous messages for context BEFORE saving current message
    // This prevents duplication of the current message in history
    let messagesForAI: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    if (!isNewConversation) {
      const previousMessages = await ChatMessageModel.getRecentMessages(
        conversation._id.toString(),
        10 // Get last 10 messages
      );
      messagesForAI = previousMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));
    }

    // Add current message to the context
    messagesForAI.push({
      role: 'user',
      content: message.trim()
    });

    log.info('🔄 Calling AI Service with conversation context', {
      openrouterConfigured: !!process.env.OPENROUTER_API_KEY,
      groqConfigured: !!process.env.GROQ_API_KEY,
      conversationId: conversation._id.toString(),
      historyMessageCount: messagesForAI.length,
    });

    // Build the request
    const chatRequest: AIChatRequest = {
      message: message.trim(),
      context: {
        page: context.page,
        course: context.course,
        username: context.username,
        userId: context.userId,
      },
    };

    // STEP 3: Send to AI service with message history
    const response = await aiService.sendChatMessage(chatRequest, messagesForAI);

    // STEP 4: Save both user message and AI response after successful AI call
    // This ensures we don't have orphaned messages if AI call fails
    await ChatMessageModel.create({
      conversationId: conversation._id.toString(),
      userId: context.userId,
      role: 'user',
      content: message.trim(),
    });

    const aiMessage = await ChatMessageModel.create({
      conversationId: conversation._id.toString(),
      userId: context.userId,
      role: 'assistant',
      content: response.reply,
      metadata: {
        provider: response.provider,
        model: response.model,
        modelType: response.modelType,
        processingTimeMs: Date.now() - startTime,
      },
    });

    // STEP 5: Format the response using ResponseFormatterService
    const formatted = ResponseFormatterService.formatResponse(
      response.reply,
      'question' // Default to question type for general chat
    );

    // Log activity for analytics (async, don't block response)
    const timeSpent = Math.round((Date.now() - new Date(requestTimestamp).getTime()) / 1000);
    FalkeAIActivityLogger.logChatQuestion({
      userId: context.userId,
      question: message.trim(),
      responseLength: response.reply.length,
      timeSpent,
      provider: response.provider,
      model: response.model,
      courseId: context.course,
    }).catch(err => log.warn('Failed to log chat activity', { error: err.message }));

    log.info('✅ AI Response received successfully', {
      page: context.page,
      userId: context.userId,
      conversationId: conversation._id.toString(),
      replyLength: response.reply.length,
      replyPreview: response.reply.substring(0, 100) + (response.reply.length > 100 ? '...' : ''),
      timestamp: response.timestamp,
      provider: response.provider,
      model: response.model,
      modelType: response.modelType,
    });

    // STEP 8: Return the response with conversation info and formatted content
    res.status(200).json({
      ...response,
      conversationId: conversation._id.toString(),
      messageId: aiMessage._id?.toString(),
      reply: formatted.html, // Send formatted HTML
      plainText: formatted.plainText, // Optional: for fallback
      structure: formatted.structure, // Optional: for UI structure
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log detailed error information for debugging
    log.error('❌ AI chat request failed', {
      error: errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorCode: error instanceof AIServiceError ? error.errorCode : undefined,
      statusCode: error instanceof AIServiceError ? error.statusCode : undefined,
      stack: errorStack,
      userId: req.body?.context?.userId,
      page: req.body?.context?.page,
      requestTimestamp,
    });

    // Determine appropriate status code and message using error codes
    let statusCode = 500;
    let userMessage = errorMessage;
    
    if (error instanceof AIServiceError) {
      // Use structured error codes for reliable categorization
      switch (error.errorCode) {
        case AIErrorCode.TIMEOUT:
          statusCode = 504;
          userMessage = 'AI service request timed out. Please try again.';
          break;
        case AIErrorCode.NETWORK_ERROR:
          statusCode = 502;
          userMessage = 'Unable to reach AI service. Please try again later.';
          break;
        case AIErrorCode.SERVICE_UNAVAILABLE:
          statusCode = 503;
          userMessage = 'AI service is temporarily unavailable. Please try again later.';
          break;
        case AIErrorCode.AUTHENTICATION_ERROR:
          statusCode = 502;
          userMessage = 'AI service authentication failed. Please contact support.';
          break;
        case AIErrorCode.INVALID_RESPONSE:
          statusCode = 502;
          userMessage = 'AI service returned an invalid response. Please try again.';
          break;
        case AIErrorCode.RATE_LIMITED:
          statusCode = 429;
          userMessage = 'AI service is busy. Please try again in a moment.';
          break;
        default:
          // Use HTTP status code from AIServiceError if available
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
 * POST /api/ai/chat/enhanced
 * 
 * Send an enhanced chat message to AI service with prompt engineering.
 * Uses a three-layer system:
 * 1. REQUEST ENHANCEMENT - Transform input into optimal prompt
 * 2. MODEL CALL - Send to AI with system prompt
 * 3. RESPONSE REFINEMENT - Clean up and structure response
 * 
 * Request body:
 * {
 *   "message": "string",
 *   "context": {
 *     "page": "Smart Lessons | Assignment | Dashboard | Ask FalkeAI",
 *     "course": "optional string",
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
 *   "modelType": "fast | balanced | reasoning | coding | fallback",
 *   "requestType": "teach | question | review | hint | explanation",
 *   "refined": {
 *     "raw": "Original raw response",
 *     "refined": "Formatted response",
 *     "formattedHtml": "HTML version",
 *     "structure": { sections, keyTakeaways, nextSteps }
 *   }
 * }
 */
export const sendEnhancedChatMessage = async (req: Request, res: Response): Promise<void> => {
  const requestTimestamp = new Date().toISOString();
  
  try {
    // Extract request fields
    const { message, context, requestType, userLearningContext } = req.body as EnhancedAIChatRequest;

    // Log incoming request with detailed info for debugging
    log.info('📨 ENHANCED AI Chat Request received', {
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      messageLength: message.length,
      userId: context.userId,
      username: context.username,
      page: context.page,
      course: context.course || 'N/A',
      requestType: requestType || 'auto-detect',
      timestamp: requestTimestamp,
    });

    // Check if AI service is configured
    if (!aiService.isConfigured()) {
      log.error('❌ AI service not configured - no API keys available');
      res.status(503).json({
        status: 'error',
        message: 'AI service is currently unavailable. Please try again later.',
      });
      return;
    }

    log.info('🔄 Calling ENHANCED AI Service', {
      openrouterConfigured: !!process.env.OPENROUTER_API_KEY,
      groqConfigured: !!process.env.GROQ_API_KEY,
      requestType: requestType || 'auto-detect',
    });

    // Build the enhanced request
    const chatRequest: EnhancedAIChatRequest = {
      message: message.trim(),
      context: {
        page: context.page,
        course: context.course,
        username: context.username,
        userId: context.userId,
      },
      requestType: requestType as AIRequestType | undefined,
      userLearningContext,
    };

    // Send to enhanced AI service and get response
    const response = await aiService.sendEnhancedChatMessage(chatRequest);

    // Log activity for analytics (async, don't block response)
    const timeSpent = Math.round((Date.now() - new Date(requestTimestamp).getTime()) / 1000);
    FalkeAIActivityLogger.logChatQuestion({
      userId: context.userId,
      question: message.trim(),
      responseLength: response.reply.length,
      timeSpent,
      provider: response.provider,
      model: response.model,
      courseId: context.course,
    }).catch(err => log.warn('Failed to log enhanced chat activity', { error: err.message }));

    log.info('✅ ENHANCED AI Response received successfully', {
      page: context.page,
      userId: context.userId,
      replyLength: response.reply.length,
      replyPreview: response.reply.substring(0, 100) + (response.reply.length > 100 ? '...' : ''),
      timestamp: response.timestamp,
      provider: response.provider,
      model: response.model,
      modelType: response.modelType,
      requestType: response.requestType,
      hasRefined: !!response.refined,
    });

    // Return the response
    res.status(200).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log detailed error information for debugging
    log.error('❌ Enhanced AI chat request failed', {
      error: errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorCode: error instanceof AIServiceError ? error.errorCode : undefined,
      statusCode: error instanceof AIServiceError ? error.statusCode : undefined,
      stack: errorStack,
      userId: req.body?.context?.userId,
      page: req.body?.context?.page,
      requestType: req.body?.requestType,
      requestTimestamp,
    });

    // Determine appropriate status code and message using error codes
    let statusCode = 500;
    let userMessage = errorMessage;
    
    if (error instanceof AIServiceError) {
      // Use structured error codes for reliable categorization
      switch (error.errorCode) {
        case AIErrorCode.TIMEOUT:
          statusCode = 504;
          userMessage = 'AI service request timed out. Please try again.';
          break;
        case AIErrorCode.NETWORK_ERROR:
          statusCode = 502;
          userMessage = 'Unable to reach AI service. Please try again later.';
          break;
        case AIErrorCode.SERVICE_UNAVAILABLE:
          statusCode = 503;
          userMessage = 'AI service is temporarily unavailable. Please try again later.';
          break;
        case AIErrorCode.AUTHENTICATION_ERROR:
          statusCode = 502;
          userMessage = 'AI service authentication failed. Please contact support.';
          break;
        case AIErrorCode.INVALID_RESPONSE:
          statusCode = 502;
          userMessage = 'AI service returned an invalid response. Please try again.';
          break;
        case AIErrorCode.RATE_LIMITED:
          statusCode = 429;
          userMessage = 'AI service is busy. Please try again in a moment.';
          break;
        default:
          // Use HTTP status code from AIServiceError if available
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
  const isConfigured = aiService.isConfigured();

  res.status(200).json({
    status: isConfigured ? 'ok' : 'unconfigured',
    service: 'AIService (OpenRouter/Groq)',
    providers: {
      openrouter: !!process.env.OPENROUTER_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
    },
    timestamp: new Date().toISOString(),
    message: isConfigured 
      ? 'AI service is properly configured' 
      : 'AI service is not configured. Set OPENROUTER_API_KEY and/or GROQ_API_KEY.',
  });
};
