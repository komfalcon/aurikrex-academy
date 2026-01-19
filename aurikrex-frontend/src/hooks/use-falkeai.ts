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

import { useState, useCallback } from 'react';
import { apiRequest } from '../utils/api';
import {
  FalkeAIChatContext,
  FalkeAIChatResponse,
  FalkeAIChatPage,
} from '../types';

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

      setIsLoading(true);
      setError(null);

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

        // Handle non-OK responses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || `Request failed (${response.status})`;
          setError(errorMessage);
          throw new Error(errorMessage);
        }

        const data: FalkeAIChatResponse = await response.json();

        // Validate response structure
        if (!data || typeof data.reply !== 'string') {
          const errorMessage = 'Invalid response from AI service';
          setError(errorMessage);
          throw new Error(errorMessage);
        }

        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
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
