/**
 * FalkeAI Service
 * 
 * A standalone service for sending messages to FalkeAI through our internal backend API.
 * Use this for non-React contexts or when you need direct function calls.
 * 
 * For React components, consider using the useFalkeAI hook instead.
 * 
 * Used by:
 * - Smart Lessons (chat + file context later)
 * - Assignment (typed submission help)
 * - Ask FalkeAI (full chat UI)
 * - Future dashboard widgets
 * 
 * IMPORTANT: This service communicates with our internal backend API,
 * which then forwards requests to FalkeAI. The frontend never calls FalkeAI directly.
 */

import { apiRequest, getToken, ApiError } from './api';
import {
  FalkeAIChatContext,
  FalkeAIChatResponse,
  FalkeAIChatPage,
} from '../types';

/**
 * Send a message to FalkeAI through the internal backend API
 * 
 * @param message - The message to send to FalkeAI
 * @param context - Context information (page, userId, username, course)
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
 *   }
 * );
 * console.log(response.reply);
 * ```
 */
export async function sendMessageToFalkeAI(
  message: string,
  context: FalkeAIChatContext
): Promise<FalkeAIChatResponse> {
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

    const data: FalkeAIChatResponse = await response.json();

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
 * @returns Promise<FalkeAIChatResponse> - The response from FalkeAI
 * 
 * @example
 * ```ts
 * const response = await sendMessage(
 *   'Help me understand this concept',
 *   'Smart Lessons',
 *   'user123',
 *   'John Doe',
 *   'Algebra 101'
 * );
 * console.log(response.reply);
 * ```
 */
export async function sendMessage(
  message: string,
  page: FalkeAIChatPage,
  userId: string,
  username: string,
  course?: string
): Promise<FalkeAIChatResponse> {
  return sendMessageToFalkeAI(message, {
    page,
    userId,
    username,
    course,
  });
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

export default {
  sendMessageToFalkeAI,
  sendMessage,
  checkAIServiceHealth,
};
