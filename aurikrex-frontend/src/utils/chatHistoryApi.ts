/**
 * Chat History API Service
 * 
 * Provides functions to interact with the chat history backend API.
 * Handles persistent chat sessions for FalkeAI conversations.
 * 
 * Features:
 * - Create and manage chat sessions
 * - Save message exchanges
 * - Retrieve chat history with pagination
 * - Get AI context for continuity
 * 
 * @module chatHistoryApi
 */

import { apiRequest, getToken } from './api';
import {
  ChatHistoryResponse,
  ChatSessionResponse,
  SaveMessageResponse,
  CreateSessionResponse,
  ChatContextResponse,
  ChatStatsResponse,
  SaveMessageInput,
  CreateSessionInput,
  FalkeAIChatPage,
} from '../types';

/**
 * Save a message exchange to chat history
 * Creates a new session if sessionId is not provided or not found.
 * 
 * @param input - Message exchange data
 * @returns Promise with session info and whether it's a new session
 * @throws Error if the request fails
 * 
 * @example
 * ```ts
 * const result = await saveMessage({
 *   userMessage: 'What is photosynthesis?',
 *   aiResponse: 'Photosynthesis is...',
 *   page: 'Ask FalkeAI',
 *   sessionId: 'existing-session-id' // optional
 * });
 * console.log('Session ID:', result.session.sessionId);
 * ```
 */
export async function saveMessage(input: SaveMessageInput): Promise<SaveMessageResponse> {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required to save messages');
  }

  console.log('[ChatHistory] 📤 Saving message exchange', {
    sessionId: input.sessionId || '(new session)',
    page: input.page,
  });

  try {
    const response = await apiRequest('/chat/save', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to save message (${response.status})`);
    }

    const data: SaveMessageResponse = await response.json();

    console.log('[ChatHistory] ✅ Message saved', {
      sessionId: data.session.sessionId,
      isNewSession: data.isNewSession,
      messageCount: data.session.messageCount,
    });

    return data;
  } catch (error) {
    console.error('[ChatHistory] ❌ Error saving message', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Create a new empty chat session
 * 
 * @param input - Session creation data
 * @returns Promise with the created session info
 * @throws Error if the request fails
 * 
 * @example
 * ```ts
 * const result = await createSession({
 *   page: 'Ask FalkeAI',
 *   title: 'My Learning Session'
 * });
 * console.log('New session:', result.session.sessionId);
 * ```
 */
export async function createSession(input: CreateSessionInput): Promise<CreateSessionResponse> {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required to create sessions');
  }

  console.log('[ChatHistory] 📝 Creating new session', {
    page: input.page,
    title: input.title,
  });

  try {
    const response = await apiRequest('/chat/session/create', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create session (${response.status})`);
    }

    const data: CreateSessionResponse = await response.json();

    console.log('[ChatHistory] ✅ Session created', {
      sessionId: data.session.sessionId,
    });

    return data;
  } catch (error) {
    console.error('[ChatHistory] ❌ Error creating session', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get all chat sessions for a user with pagination
 * 
 * @param userId - User ID to get history for
 * @param options - Pagination and filter options
 * @returns Promise with paginated session list
 * @throws Error if the request fails
 * 
 * @example
 * ```ts
 * const history = await getChatHistory(userId, {
 *   page: 1,
 *   limit: 20,
 *   isActive: true,
 *   pageFilter: 'Ask FalkeAI'
 * });
 * console.log('Sessions:', history.sessions.length);
 * ```
 */
export async function getChatHistory(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    pageFilter?: FalkeAIChatPage;
  } = {}
): Promise<ChatHistoryResponse> {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required to get chat history');
  }

  // Build query string
  const params = new URLSearchParams();
  if (options.page) params.append('page', options.page.toString());
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.isActive !== undefined) params.append('isActive', options.isActive.toString());
  if (options.pageFilter) params.append('pageFilter', options.pageFilter);

  const queryString = params.toString();
  const url = `/chat/history/${userId}${queryString ? `?${queryString}` : ''}`;

  console.log('[ChatHistory] 📋 Getting chat history', {
    userId,
    ...options,
  });

  try {
    const response = await apiRequest(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to get chat history (${response.status})`);
    }

    const data: ChatHistoryResponse = await response.json();

    console.log('[ChatHistory] ✅ Chat history retrieved', {
      sessionsCount: data.sessions.length,
      total: data.pagination.total,
    });

    return data;
  } catch (error) {
    console.error('[ChatHistory] ❌ Error getting chat history', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    throw error;
  }
}

/**
 * Get a specific chat session with messages
 * 
 * @param sessionId - Session identifier
 * @param options - Pagination options for messages
 * @returns Promise with session data and messages
 * @throws Error if the request fails
 * 
 * @example
 * ```ts
 * const session = await getSession('sess_abc123', {
 *   limit: 50,
 *   skip: 0
 * });
 * console.log('Messages:', session.session.messages.length);
 * ```
 */
export async function getSession(
  sessionId: string,
  options: {
    limit?: number;
    skip?: number;
  } = {}
): Promise<ChatSessionResponse> {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required to get session');
  }

  // Build query string
  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.skip) params.append('skip', options.skip.toString());

  const queryString = params.toString();
  const url = `/chat/session/${sessionId}${queryString ? `?${queryString}` : ''}`;

  console.log('[ChatHistory] 📋 Getting session', {
    sessionId,
    ...options,
  });

  try {
    const response = await apiRequest(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to get session (${response.status})`);
    }

    const data: ChatSessionResponse = await response.json();

    console.log('[ChatHistory] ✅ Session retrieved', {
      sessionId,
      messageCount: data.session.messages.length,
    });

    return data;
  } catch (error) {
    console.error('[ChatHistory] ❌ Error getting session', {
      error: error instanceof Error ? error.message : String(error),
      sessionId,
    });
    throw error;
  }
}

/**
 * Get AI context from a session (recent messages for conversation continuity)
 * 
 * @param sessionId - Session identifier
 * @param maxMessages - Maximum messages to retrieve (default: 20, max: 50)
 * @returns Promise with context messages
 * @throws Error if the request fails
 * 
 * @example
 * ```ts
 * const context = await getSessionContext('sess_abc123', 10);
 * // Use context.context.messages for AI conversation history
 * ```
 */
export async function getSessionContext(
  sessionId: string,
  maxMessages: number = 20
): Promise<ChatContextResponse> {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required to get session context');
  }

  const url = `/chat/session/${sessionId}/context?maxMessages=${Math.min(maxMessages, 50)}`;

  console.log('[ChatHistory] 🤖 Getting AI context', {
    sessionId,
    maxMessages,
  });

  try {
    const response = await apiRequest(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to get session context (${response.status})`);
    }

    const data: ChatContextResponse = await response.json();

    console.log('[ChatHistory] ✅ AI context retrieved', {
      sessionId,
      messagesCount: data.context.messages.length,
    });

    return data;
  } catch (error) {
    console.error('[ChatHistory] ❌ Error getting session context', {
      error: error instanceof Error ? error.message : String(error),
      sessionId,
    });
    throw error;
  }
}

/**
 * Delete a chat session permanently
 * 
 * @param sessionId - Session identifier to delete
 * @returns Promise that resolves when deleted
 * @throws Error if the request fails
 * 
 * @example
 * ```ts
 * await deleteSession('sess_abc123');
 * console.log('Session deleted');
 * ```
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required to delete sessions');
  }

  console.log('[ChatHistory] 🗑️ Deleting session', { sessionId });

  try {
    const response = await apiRequest(`/chat/session/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete session (${response.status})`);
    }

    console.log('[ChatHistory] ✅ Session deleted', { sessionId });
  } catch (error) {
    console.error('[ChatHistory] ❌ Error deleting session', {
      error: error instanceof Error ? error.message : String(error),
      sessionId,
    });
    throw error;
  }
}

/**
 * Clear all messages from a session while keeping the session
 * 
 * @param sessionId - Session identifier to clear
 * @returns Promise with updated session info
 * @throws Error if the request fails
 * 
 * @example
 * ```ts
 * await clearSession('sess_abc123');
 * console.log('Session cleared');
 * ```
 */
export async function clearSession(sessionId: string): Promise<{ sessionId: string; title: string }> {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required to clear sessions');
  }

  console.log('[ChatHistory] 🧹 Clearing session', { sessionId });

  try {
    const response = await apiRequest(`/chat/session/${sessionId}/clear`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to clear session (${response.status})`);
    }

    const data = await response.json();

    console.log('[ChatHistory] ✅ Session cleared', { sessionId });

    return data.session;
  } catch (error) {
    console.error('[ChatHistory] ❌ Error clearing session', {
      error: error instanceof Error ? error.message : String(error),
      sessionId,
    });
    throw error;
  }
}

/**
 * Get chat statistics for the authenticated user
 * 
 * @returns Promise with user chat statistics
 * @throws Error if the request fails
 * 
 * @example
 * ```ts
 * const stats = await getChatStats();
 * console.log('Total sessions:', stats.stats.totalSessions);
 * ```
 */
export async function getChatStats(): Promise<ChatStatsResponse> {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required to get chat stats');
  }

  console.log('[ChatHistory] 📊 Getting chat stats');

  try {
    const response = await apiRequest('/chat/stats', {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to get chat stats (${response.status})`);
    }

    const data: ChatStatsResponse = await response.json();

    console.log('[ChatHistory] ✅ Chat stats retrieved', {
      totalSessions: data.stats.totalSessions,
      totalMessages: data.stats.totalMessages,
    });

    return data;
  } catch (error) {
    console.error('[ChatHistory] ❌ Error getting chat stats', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export default {
  saveMessage,
  createSession,
  getChatHistory,
  getSession,
  getSessionContext,
  deleteSession,
  clearSession,
  getChatStats,
};
