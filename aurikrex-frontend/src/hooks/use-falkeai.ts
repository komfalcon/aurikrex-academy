/**
 * FalkeAI Service Hook
 * 
 * A reusable hook for sending messages to FalkeAI through our internal backend API.
 * This hook handles all communication with the AI service, including:
 * - Request formatting and authentication
 * - Error handling
 * - Loading state management
 * 
 * Used by:
 * - Smart Lessons (chat + file context later)
 * - Assignment (typed submission help)
 * - Ask FalkeAI (full chat UI)
 * - Future dashboard widgets
 * 
 * IMPORTANT: This hook communicates with our internal backend API,
 * which then forwards requests to FalkeAI. The frontend never calls FalkeAI directly.
 */

import { useState, useCallback, useRef } from 'react';
import { apiRequest, getToken, ApiError } from '../utils/api';
import {
  FalkeAIChatContext,
  FalkeAIChatResponse,
  FalkeAIChatPage,
} from '../types';

// Minimum interval between requests (1 second)
const MIN_REQUEST_INTERVAL = 1000;

/**
 * Response type for the useFalkeAI hook
 */
interface UseFalkeAIReturn {
  /** Send a message to FalkeAI */
  sendMessage: (message: string, context: FalkeAIChatContext) => Promise<FalkeAIChatResponse>;
  /** Helper function to send a message with minimal context */
  sendMessageToFalkeAI: (
    message: string,
    page: FalkeAIChatPage,
    userId: string,
    username: string,
    course?: string
  ) => Promise<FalkeAIChatResponse>;
  /** Whether a request is currently in progress */
  isLoading: boolean;
  /** The last error that occurred, if any */
  error: string | null;
  /** Clear the current error */
  clearError: () => void;
}

/**
 * Hook for communicating with FalkeAI through the internal backend API
 * 
 * @example
 * ```tsx
 * const { sendMessageToFalkeAI, isLoading, error } = useFalkeAI();
 * 
 * const handleSend = async () => {
 *   try {
 *     const response = await sendMessageToFalkeAI(
 *       'Hello, FalkeAI!',
 *       'Ask FalkeAI',
 *       user.uid,
 *       user.displayName || 'User'
 *     );
 *     console.log('Response:', response.reply);
 *   } catch (err) {
 *     console.error('Failed to send message:', err);
 *   }
 * };
 * ```
 */
export function useFalkeAI(): UseFalkeAIReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for debouncing - prevent rapid-fire requests
  const isLoadingRef = useRef(false);
  const lastRequestTimeRef = useRef(0);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Send a message to FalkeAI with full context control
   */
  const sendMessage = useCallback(
    async (message: string, context: FalkeAIChatContext): Promise<FalkeAIChatResponse> => {
      // Validate inputs
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        throw new Error('Message is required');
      }

      if (!context.userId || !context.username || !context.page) {
        throw new Error('Context with userId, username, and page is required');
      }

      // Check authentication before making request
      const token = getToken();
      if (!token) {
        console.error('[useFalkeAI] No authentication token found');
        throw new Error('Please sign in to use FalkeAI');
      }

      // Debouncing: Prevent rapid-fire requests
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTimeRef.current;

      // Check if a request is already in progress
      if (isLoadingRef.current) {
        console.warn('⚠️ [useFalkeAI] Request already in progress, ignoring duplicate request');
        throw new Error('A request is already processing. Please wait...');
      }

      // Check if too soon since last request
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        const waitSeconds = Math.ceil(waitTime / 1000);
        console.warn(`⚠️ [useFalkeAI] Too many requests. Please wait ${waitSeconds}s`);
        throw new Error(`Please wait ${waitSeconds} second${waitSeconds !== 1 ? 's' : ''} before sending another message`);
      }

      // Update refs to track request state
      isLoadingRef.current = true;
      lastRequestTimeRef.current = now;

      setIsLoading(true);
      setError(null);

      const requestTimestamp = new Date().toISOString();
      
      // Log request details for debugging
      console.log('📤 [useFalkeAI] Sending message to FalkeAI:', {
        endpoint: '/ai/chat',
        messageLength: message.trim().length,
        messagePreview: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        page: context.page,
        userId: context.userId,
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

        // Log response status
        console.log('📥 [useFalkeAI] Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        // Handle non-OK responses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ [useFalkeAI] API Error:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            timestamp: requestTimestamp,
          });
          
          // Determine user-friendly error message
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
          
          setError(errorMessage);
          throw new Error(errorMessage);
        }

        const data: FalkeAIChatResponse = await response.json();

        // Validate response structure
        if (!data || typeof data.reply !== 'string') {
          console.error('❌ [useFalkeAI] Invalid response structure:', {
            hasData: !!data,
            hasReply: data ? typeof data.reply : 'no data',
            receivedKeys: data ? Object.keys(data) : [],
          });
          const errorMessage = 'Invalid response from AI service';
          setError(errorMessage);
          throw new Error(errorMessage);
        }

        console.log('✅ [useFalkeAI] Success:', {
          replyLength: data.reply.length,
          replyPreview: data.reply.substring(0, 100) + (data.reply.length > 100 ? '...' : ''),
          timestamp: data.timestamp,
        });

        return data;
      } catch (err) {
        const errorInstance = err instanceof Error ? err : new Error(String(err));
        
        // Detailed error logging
        console.error('🚨 [useFalkeAI] Request failed:', {
          errorType: errorInstance.name,
          errorMessage: errorInstance.message,
          page: context.page,
          timestamp: requestTimestamp,
        });

        // Handle specific error types using ApiError properties
        if (err instanceof ApiError) {
          if (err.isNetworkError) {
            const networkError = 'Network error: Unable to reach the server. Please check your connection.';
            setError(networkError);
            throw new Error(networkError);
          }
          if (err.isTimeout) {
            const timeoutError = 'Request timed out. Please try again.';
            setError(timeoutError);
            throw new Error(timeoutError);
          }
        }

        setError(errorInstance.message);
        throw err;
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    },
    []
  );

  /**
   * Helper function to send a message with minimal parameters
   * This is the primary function that should be used by most components
   */
  const sendMessageToFalkeAI = useCallback(
    async (
      message: string,
      page: FalkeAIChatPage,
      userId: string,
      username: string,
      course?: string
    ): Promise<FalkeAIChatResponse> => {
      return sendMessage(message, {
        page,
        userId,
        username,
        course,
      });
    },
    [sendMessage]
  );

  return {
    sendMessage,
    sendMessageToFalkeAI,
    isLoading,
    error,
    clearError,
  };
}

export default useFalkeAI;
