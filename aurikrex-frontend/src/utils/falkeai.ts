/**
 * FalkeAI Service
 * 
 * A standalone service for sending messages to FalkeAI through our internal backend API.
 * Use this for non-React contexts or when you need direct function calls.
 * 
 * For React components, consider using the useFalkeAI hook instead.
 * 
 * Used by:
 * - Study Partner (chat + file context later)
 * - Assignment (typed submission help)
 * - Ask FalkeAI (full chat UI)
 * - Future dashboard widgets
 * 
 * IMPORTANT: This service communicates with our internal backend API,
 * which then forwards requests to FalkeAI. The frontend never calls FalkeAI directly.
 * 
 * Chat History Integration:
 * - Use saveMessageWithHistory to automatically save messages to persistent history
 * - Use getConversationContext to retrieve past messages for AI context
 */

import { apiRequest, getToken, ApiError } from './api';
import {
  FalkeAIChatContext,
  FalkeAIChatResponse,
  FalkeAIChatPage,
  EnhancedFalkeAIChatResponse,
  AIRequestType,
  UserLearningContext,
} from '../types';
import { saveMessage as saveMessageApi, getSessionContext } from './chatHistoryApi';

/**
 * Send a message to FalkeAI through the internal backend API
 * 
 * @param message - The message to send to FalkeAI
 * @param context - Context information (page, userId, username, course)
 * @param conversationId - Optional conversation ID for message history
 * @returns Promise<FalkeAIChatResponse> - The response from FalkeAI
 * @throws Error if the request fails or returns an error
 * 
 * @example
 * ```ts
 * const response = await sendMessageToFalkeAI(
 *   'Hello, FalkeAI!',
 *   {
 *     page: 'Ask FalkeAI',
 *     userId: 'user123',
 *     username: 'John Doe',
 *     course: 'Math 101'
 *   },
 *   'conversation-id-123'
 * );
 * console.log(response.reply);
 * ```
 */
export async function sendMessageToFalkeAI(
  message: string,
  context: FalkeAIChatContext,
  conversationId?: string
): Promise<FalkeAIChatResponse & { conversationId?: string; messageId?: string }> {
  const requestTimestamp = new Date().toISOString();
  
  // Validate inputs
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    console.error('[FalkeAI] Error: Message is required');
    throw new Error('Message is required');
  }

  if (!context.userId || !context.username || !context.page) {
    console.error('[FalkeAI] Error: Missing required context fields', {
      hasUserId: !!context.userId,
      hasUsername: !!context.username,
      hasPage: !!context.page,
    });
    throw new Error('Context with userId, username, and page is required');
  }

  // Check token before making request
  const token = getToken();
  if (!token) {
    console.error('[FalkeAI] Error: No authentication token found');
    throw new Error('Please sign in to use FalkeAI');
  }

  console.log('[FalkeAI] 📤 Sending message', {
    endpoint: '/ai/chat',
    page: context.page,
    userId: context.userId,
    conversationId: conversationId || '(new conversation)',
    messageLength: message.trim().length,
    messagePreview: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
    hasAuth: !!token,
    timestamp: requestTimestamp,
  });

  try {
    const response = await apiRequest('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: message.trim(),
        context: {
          page: context.page,
          course: context.course,
          username: context.username,
          userId: context.userId,
        },
        conversationId: conversationId || undefined,
      }),
    });

    // Log response status for debugging
    console.log('[FalkeAI] 📥 Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[FalkeAI] ❌ API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        timestamp: requestTimestamp,
      });
      
      // Determine user-friendly error message based on status code
      let errorMessage = errorData.message || `Request failed (${response.status})`;
      
      if (response.status === 401) {
        errorMessage = 'Authentication failed. Please sign in again.';
      } else if (response.status === 403) {
        errorMessage = 'You do not have permission to use the AI chat.';
      } else if (response.status === 503) {
        errorMessage = 'AI service is temporarily unavailable. Please try again later.';
      } else if (response.status === 504) {
        errorMessage = 'AI service request timed out. Please try again.';
      }
      
      throw new Error(errorMessage);
    }

    const data: FalkeAIChatResponse & { conversationId?: string; messageId?: string } = await response.json();

    // Validate response structure
    if (!data || typeof data.reply !== 'string') {
      console.error('[FalkeAI] ❌ Error: Invalid response structure', {
        hasData: !!data,
        hasReply: data ? typeof data.reply : 'no data',
        receivedKeys: data ? Object.keys(data) : [],
      });
      throw new Error('Invalid response from AI service');
    }

    console.log('[FalkeAI] ✅ Success:', {
      replyLength: data.reply.length,
      replyPreview: data.reply.substring(0, 100) + (data.reply.length > 100 ? '...' : ''),
      timestamp: data.timestamp,
      conversationId: data.conversationId,
    });

    return data;
  } catch (error) {
    // Log error details for debugging (avoid sensitive data)
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    
    console.error('[FalkeAI] 🚨 Request failed:', {
      errorType: errorInstance.name,
      errorMessage: errorInstance.message,
      page: context.page,
      timestamp: requestTimestamp,
    });

    // Handle specific error types using ApiError properties
    if (error instanceof ApiError) {
      if (error.isNetworkError) {
        throw new Error('Network error: Unable to reach the server. Please check your connection.');
      }
      if (error.isTimeout) {
        throw new Error('Request timed out. Please try again.');
      }
    }

    throw error;
  }
}

/**
 * Simplified function to send a message to FalkeAI
 * 
 * @param message - The message to send
 * @param page - The page context (Smart Lessons, Assignment, Dashboard, Ask FalkeAI)
 * @param userId - The user's ID
 * @param username - The user's display name
 * @param course - Optional course context
 * @param conversationId - Optional conversation ID for message history
 * @returns Promise<FalkeAIChatResponse> - The response from FalkeAI
 * 
 * @example
 * ```ts
 * const response = await sendMessage(
 *   'Help me understand this concept',
 *   'Smart Lessons',
 *   'user123',
 *   'John Doe',
 *   'Algebra 101',
 *   'conversation-id-123'
 * );
 * console.log(response.reply);
 * ```
 */
export async function sendMessage(
  message: string,
  page: FalkeAIChatPage,
  userId: string,
  username: string,
  course?: string,
  conversationId?: string
): Promise<FalkeAIChatResponse & { conversationId?: string; messageId?: string }> {
  return sendMessageToFalkeAI(message, {
    page,
    userId,
    username,
    course,
  }, conversationId);
}

/**
 * Check if the AI service is available
 * 
 * @returns Promise<boolean> - Whether the AI service is configured and available
 */
export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    console.log('[FalkeAI] Checking AI service health...');
    
    const response = await apiRequest('/ai/health', {
      method: 'GET',
    });

    if (!response.ok) {
      console.warn('[FalkeAI] Health check failed:', {
        status: response.status,
        statusText: response.statusText,
      });
      return false;
    }

    const data = await response.json();
    const isHealthy = data.status === 'ok';
    
    console.log('[FalkeAI] Health check result:', {
      status: data.status,
      service: data.service,
      isHealthy,
    });
    
    return isHealthy;
  } catch (error) {
    console.error('[FalkeAI] Health check error:', error);
    return false;
  }
}

/**
 * Send an enhanced message to FalkeAI with prompt engineering
 * 
 * This uses the three-layer prompt engineering system:
 * 1. REQUEST ENHANCEMENT - Transform input into optimal prompt
 * 2. MODEL CALL - Send to AI with system prompt
 * 3. RESPONSE REFINEMENT - Clean up and structure response
 * 
 * @param message - The message to send
 * @param context - Context information (page, userId, username, course)
 * @param requestType - Optional type of request (teach, question, review, hint, explanation)
 * @param userLearningContext - Optional user learning profile for personalization
 * @returns Promise<EnhancedFalkeAIChatResponse> - The enhanced response from FalkeAI
 * 
 * @example
 * ```ts
 * const response = await sendEnhancedMessageToFalkeAI(
 *   'Teach me Quantum Mechanics',
 *   {
 *     page: 'Smart Lessons',
 *     userId: 'user123',
 *     username: 'John Doe'
 *   },
 *   'teach',
 *   { knowledgeLevel: 'beginner' }
 * );
 * console.log(response.refined?.formattedHtml);
 * ```
 */
export async function sendEnhancedMessageToFalkeAI(
  message: string,
  context: FalkeAIChatContext,
  requestType?: AIRequestType,
  userLearningContext?: Partial<UserLearningContext>
): Promise<EnhancedFalkeAIChatResponse> {
  const requestTimestamp = new Date().toISOString();
  
  // Validate inputs
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    console.error('[FalkeAI Enhanced] Error: Message is required');
    throw new Error('Message is required');
  }

  if (!context.userId || !context.username || !context.page) {
    console.error('[FalkeAI Enhanced] Error: Missing required context fields', {
      hasUserId: !!context.userId,
      hasUsername: !!context.username,
      hasPage: !!context.page,
    });
    throw new Error('Context with userId, username, and page is required');
  }

  // Check token before making request
  const token = getToken();
  if (!token) {
    console.error('[FalkeAI Enhanced] Error: No authentication token found');
    throw new Error('Please sign in to use FalkeAI');
  }

  console.log('[FalkeAI Enhanced] 📤 Sending enhanced message', {
    endpoint: '/ai/chat/enhanced',
    page: context.page,
    userId: context.userId,
    requestType: requestType || 'auto-detect',
    messageLength: message.trim().length,
    messagePreview: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
    hasAuth: !!token,
    timestamp: requestTimestamp,
  });

  try {
    const response = await apiRequest('/ai/chat/enhanced', {
      method: 'POST',
      body: JSON.stringify({
        message: message.trim(),
        context: {
          page: context.page,
          course: context.course,
          username: context.username,
          userId: context.userId,
        },
        requestType,
        userLearningContext,
      }),
    });

    // Log response status for debugging
    console.log('[FalkeAI Enhanced] 📥 Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[FalkeAI Enhanced] ❌ API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        timestamp: requestTimestamp,
      });
      
      // Determine user-friendly error message based on status code
      let errorMessage = errorData.message || `Request failed (${response.status})`;
      
      if (response.status === 401) {
        errorMessage = 'Authentication failed. Please sign in again.';
      } else if (response.status === 403) {
        errorMessage = 'You do not have permission to use the AI chat.';
      } else if (response.status === 503) {
        errorMessage = 'AI service is temporarily unavailable. Please try again later.';
      } else if (response.status === 504) {
        errorMessage = 'AI service request timed out. Please try again.';
      }
      
      throw new Error(errorMessage);
    }

    const data: EnhancedFalkeAIChatResponse = await response.json();

    // Validate response structure
    if (!data || typeof data.reply !== 'string') {
      console.error('[FalkeAI Enhanced] ❌ Error: Invalid response structure', {
        hasData: !!data,
        hasReply: data ? typeof data.reply : 'no data',
        receivedKeys: data ? Object.keys(data) : [],
      });
      throw new Error('Invalid response from AI service');
    }

    console.log('[FalkeAI Enhanced] ✅ Success:', {
      replyLength: data.reply.length,
      replyPreview: data.reply.substring(0, 100) + (data.reply.length > 100 ? '...' : ''),
      timestamp: data.timestamp,
      requestType: data.requestType,
      hasRefined: !!data.refined,
      provider: data.provider,
      model: data.model,
    });

    return data;
  } catch (error) {
    // Log error details for debugging (avoid sensitive data)
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    
    console.error('[FalkeAI Enhanced] 🚨 Request failed:', {
      errorType: errorInstance.name,
      errorMessage: errorInstance.message,
      page: context.page,
      requestType,
      timestamp: requestTimestamp,
    });

    // Handle specific error types using ApiError properties
    if (error instanceof ApiError) {
      if (error.isNetworkError) {
        throw new Error('Network error: Unable to reach the server. Please check your connection.');
      }
      if (error.isTimeout) {
        throw new Error('Request timed out. Please try again.');
      }
    }

    throw error;
  }
}

/**
 * Simplified function to send an enhanced message to FalkeAI
 * 
 * @param message - The message to send
 * @param page - The page context (Smart Lessons, Assignment, Dashboard, Ask FalkeAI)
 * @param userId - The user's ID
 * @param username - The user's display name
 * @param requestType - Optional type of request (teach, question, review, hint, explanation)
 * @param course - Optional course context
 * @param userLearningContext - Optional user learning profile for personalization
 * @returns Promise<EnhancedFalkeAIChatResponse> - The enhanced response from FalkeAI
 * 
 * @example
 * ```ts
 * const response = await sendEnhancedMessage(
 *   'Help me understand derivatives',
 *   'Smart Lessons',
 *   'user123',
 *   'John Doe',
 *   'teach',
 *   'Calculus 101',
 *   { knowledgeLevel: 'intermediate' }
 * );
 * console.log(response.refined?.keyTakeaways);
 * ```
 */
export async function sendEnhancedMessage(
  message: string,
  page: FalkeAIChatPage,
  userId: string,
  username: string,
  requestType?: AIRequestType,
  course?: string,
  userLearningContext?: Partial<UserLearningContext>
): Promise<EnhancedFalkeAIChatResponse> {
  return sendEnhancedMessageToFalkeAI(message, {
    page,
    userId,
    username,
    course,
  }, requestType, userLearningContext);
}

// ============================================
// Chat History Integration Functions
// ============================================

/**
 * Send a message to FalkeAI and automatically save to chat history
 * 
 * This function combines the AI call with persistent storage:
 * 1. Sends the message to FalkeAI
 * 2. Saves both user message and AI response to chat history
 * 3. Returns the response along with session info
 * 
 * @param message - The message to send
 * @param page - The page context
 * @param userId - The user's ID
 * @param username - The user's display name
 * @param sessionId - Optional existing session ID
 * @param course - Optional course context
 * @returns Promise with AI response and session info
 * 
 * @example
 * ```ts
 * const result = await sendMessageWithHistory(
 *   'What is quantum physics?',
 *   'Ask FalkeAI',
 *   'user123',
 *   'John Doe',
 *   'existing-session-id'
 * );
 * console.log('Response:', result.response.reply);
 * console.log('Session:', result.sessionId);
 * ```
 */
export async function sendMessageWithHistory(
  message: string,
  page: FalkeAIChatPage,
  userId: string,
  username: string,
  sessionId?: string,
  course?: string
): Promise<{
  response: FalkeAIChatResponse;
  sessionId: string;
  isNewSession: boolean;
}> {
  console.log('[FalkeAI] 📤 Sending message with history tracking', {
    page,
    userId,
    sessionId: sessionId || '(new session)',
  });

  // Send message to FalkeAI
  const response = await sendMessageToFalkeAI(message, {
    page,
    userId,
    username,
    course,
  }, sessionId);

  // Save to chat history
  try {
    const saveResult = await saveMessageApi({
      sessionId,
      userMessage: message.trim(),
      aiResponse: response.reply,
      page,
      course,
      metadata: {
        provider: (response as { provider?: string }).provider,
        model: (response as { model?: string }).model,
        modelType: (response as { modelType?: string }).modelType,
      },
    });

    console.log('[FalkeAI] ✅ Message saved to history', {
      sessionId: saveResult.session.sessionId,
      isNewSession: saveResult.isNewSession,
    });

    return {
      response,
      sessionId: saveResult.session.sessionId,
      isNewSession: saveResult.isNewSession,
    };
  } catch (saveError) {
    // Log error but don't fail the request - the AI response was successful
    console.warn('[FalkeAI] ⚠️ Failed to save to history, continuing with response', {
      error: saveError instanceof Error ? saveError.message : String(saveError),
    });

    return {
      response,
      sessionId: sessionId || '',
      isNewSession: !sessionId,
    };
  }
}

/**
 * Get conversation context from chat history for AI continuity
 * 
 * Retrieves past messages from a session to provide context for AI responses.
 * Use this to give FalkeAI memory of past conversations.
 * 
 * @param sessionId - The session to get context from
 * @param maxMessages - Maximum messages to retrieve (default: 20)
 * @returns Array of messages formatted for AI context
 * 
 * @example
 * ```ts
 * const context = await getConversationContext('sess_abc123', 10);
 * // Use context when building AI prompt for better continuity
 * ```
 */
export async function getConversationContext(
  sessionId: string,
  maxMessages: number = 20
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  try {
    const result = await getSessionContext(sessionId, maxMessages);
    return result.context.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));
  } catch (error) {
    console.warn('[FalkeAI] ⚠️ Failed to get conversation context', {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export default {
  sendMessageToFalkeAI,
  sendMessage,
  sendEnhancedMessageToFalkeAI,
  sendEnhancedMessage,
  checkAIServiceHealth,
  sendMessageWithHistory,
  getConversationContext,
};
