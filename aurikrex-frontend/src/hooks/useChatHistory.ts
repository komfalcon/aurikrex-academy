/**
 * useChatHistory Hook
 * 
 * React hook for managing persistent chat history with FalkeAI.
 * Provides state management and API integration for chat sessions.
 * 
 * Features:
 * - Automatic session loading and caching
 * - Real-time message saving
 * - Session switching
 * - Pagination support
 * - Error handling
 * 
 * @module useChatHistory
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  saveMessage as saveMessageApi,
  createSession as createSessionApi,
  getChatHistory,
  getSession,
  getSessionContext,
  deleteSession as deleteSessionApi,
  clearSession as clearSessionApi,
} from '../utils/chatHistoryApi';
import {
  ChatSessionSummary,
  ChatSession,
  ChatMessage,
  FalkeAIChatPage,
  SaveMessageInput,
} from '../types';

/**
 * Hook state interface
 */
interface UseChatHistoryState {
  /** List of user's chat sessions (summaries) */
  sessions: ChatSessionSummary[];
  /** Currently active/selected session */
  activeSession: ChatSession | null;
  /** Currently active session ID */
  activeSessionId: string | null;
  /** Whether sessions are being loaded */
  isLoadingSessions: boolean;
  /** Whether active session is being loaded */
  isLoadingSession: boolean;
  /** Whether a message is being saved */
  isSaving: boolean;
  /** Current error message, if any */
  error: string | null;
  /** Total sessions count */
  totalSessions: number;
  /** Whether there are more sessions to load */
  hasMoreSessions: boolean;
}

/**
 * Hook return interface
 */
interface UseChatHistoryReturn extends UseChatHistoryState {
  /** Load user's chat history */
  loadSessions: (page?: number, pageFilter?: FalkeAIChatPage) => Promise<void>;
  /** Load more sessions (pagination) */
  loadMoreSessions: () => Promise<void>;
  /** Load a specific session with messages */
  loadSession: (sessionId: string) => Promise<ChatSession | null>;
  /** Create a new empty session */
  createSession: (page: FalkeAIChatPage, course?: string, title?: string) => Promise<string>;
  /** Save a message exchange and optionally create new session */
  saveMessage: (input: SaveMessageInput) => Promise<{ sessionId: string; isNewSession: boolean }>;
  /** Switch to a different session */
  switchSession: (sessionId: string) => Promise<void>;
  /** Delete a session */
  deleteSession: (sessionId: string) => Promise<void>;
  /** Clear messages from a session */
  clearSession: (sessionId: string) => Promise<void>;
  /** Get AI context for a session */
  getContext: (sessionId: string, maxMessages?: number) => Promise<Array<{ role: 'user' | 'assistant'; content: string }>>;
  /** Add message to local state (for immediate UI update) */
  addLocalMessage: (message: Omit<ChatMessage, '_id'>) => void;
  /** Clear error */
  clearError: () => void;
  /** Reset to initial state */
  reset: () => void;
}

/**
 * Initial state
 */
const initialState: UseChatHistoryState = {
  sessions: [],
  activeSession: null,
  activeSessionId: null,
  isLoadingSessions: false,
  isLoadingSession: false,
  isSaving: false,
  error: null,
  totalSessions: 0,
  hasMoreSessions: false,
};

/**
 * Hook for managing chat history with FalkeAI
 * 
 * @param userId - Current user's ID
 * @param options - Configuration options
 * @returns Chat history state and methods
 * 
 * @example
 * ```tsx
 * const {
 *   sessions,
 *   activeSession,
 *   loadSessions,
 *   saveMessage,
 *   switchSession,
 *   isLoading,
 *   error
 * } = useChatHistory(user.uid);
 * 
 * // Load history on mount
 * useEffect(() => {
 *   if (user.uid) {
 *     loadSessions();
 *   }
 * }, [user.uid, loadSessions]);
 * 
 * // Save a new message
 * const handleSend = async (message: string, aiResponse: string) => {
 *   await saveMessage({
 *     userMessage: message,
 *     aiResponse,
 *     page: 'Ask FalkeAI',
 *     sessionId: activeSession?.sessionId
 *   });
 * };
 * ```
 */
export function useChatHistory(
  userId: string | undefined,
  options: {
    /** Sessions per page (default: 20) */
    pageSize?: number;
    /** Auto-load sessions on mount (default: false) */
    autoLoad?: boolean;
    /** Default page filter */
    defaultPageFilter?: FalkeAIChatPage;
  } = {}
): UseChatHistoryReturn {
  const { pageSize = 20, autoLoad = false, defaultPageFilter } = options;
  
  const [state, setState] = useState<UseChatHistoryState>(initialState);
  
  // Track current page for pagination
  const currentPageRef = useRef(1);
  const pageFilterRef = useRef<FalkeAIChatPage | undefined>(defaultPageFilter);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setState(initialState);
    currentPageRef.current = 1;
    pageFilterRef.current = defaultPageFilter;
  }, [defaultPageFilter]);

  /**
   * Load chat sessions
   */
  const loadSessions = useCallback(async (
    page: number = 1,
    pageFilter?: FalkeAIChatPage
  ): Promise<void> => {
    if (!userId) {
      setState(prev => ({ ...prev, error: 'User ID is required' }));
      return;
    }

    setState(prev => ({ ...prev, isLoadingSessions: true, error: null }));
    currentPageRef.current = page;
    if (pageFilter !== undefined) {
      pageFilterRef.current = pageFilter;
    }

    try {
      const result = await getChatHistory(userId, {
        page,
        limit: pageSize,
        pageFilter: pageFilterRef.current,
      });

      setState(prev => ({
        ...prev,
        sessions: page === 1 ? result.sessions : [...prev.sessions, ...result.sessions],
        totalSessions: result.pagination.total,
        hasMoreSessions: result.pagination.hasMore,
        isLoadingSessions: false,
      }));

      console.log('[useChatHistory] ✅ Sessions loaded', {
        page,
        count: result.sessions.length,
        total: result.pagination.total,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load sessions';
      setState(prev => ({
        ...prev,
        isLoadingSessions: false,
        error: errorMessage,
      }));
      console.error('[useChatHistory] ❌ Error loading sessions', { error: errorMessage });
    }
  }, [userId, pageSize]);

  /**
   * Load more sessions (pagination)
   */
  const loadMoreSessions = useCallback(async (): Promise<void> => {
    if (state.hasMoreSessions && !state.isLoadingSessions) {
      await loadSessions(currentPageRef.current + 1);
    }
  }, [state.hasMoreSessions, state.isLoadingSessions, loadSessions]);

  /**
   * Load a specific session with messages
   */
  const loadSession = useCallback(async (sessionId: string): Promise<ChatSession | null> => {
    setState(prev => ({ ...prev, isLoadingSession: true, error: null }));

    try {
      const result = await getSession(sessionId);
      
      setState(prev => ({
        ...prev,
        activeSession: result.session,
        activeSessionId: sessionId,
        isLoadingSession: false,
      }));

      console.log('[useChatHistory] ✅ Session loaded', {
        sessionId,
        messageCount: result.session.messages.length,
      });

      return result.session;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load session';
      setState(prev => ({
        ...prev,
        isLoadingSession: false,
        error: errorMessage,
      }));
      console.error('[useChatHistory] ❌ Error loading session', { sessionId, error: errorMessage });
      return null;
    }
  }, []);

  /**
   * Create a new empty session
   */
  const createSession = useCallback(async (
    page: FalkeAIChatPage,
    course?: string,
    title?: string
  ): Promise<string> => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      const result = await createSessionApi({ page, course, title });
      
      // Add new session to the beginning of the list
      const newSessionSummary: ChatSessionSummary = {
        _id: result.session.sessionId, // Temporary, will be updated
        userId,
        sessionId: result.session.sessionId,
        title: result.session.title,
        isActive: result.session.isActive,
        page: result.session.page,
        course: result.session.course,
        messageCount: 0,
        createdAt: result.session.createdAt,
        updatedAt: result.session.createdAt,
        lastMessageAt: result.session.createdAt,
      };

      setState(prev => ({
        ...prev,
        sessions: [newSessionSummary, ...prev.sessions],
        activeSessionId: result.session.sessionId,
        activeSession: {
          ...newSessionSummary,
          messages: [],
        },
        isSaving: false,
        totalSessions: prev.totalSessions + 1,
      }));

      console.log('[useChatHistory] ✅ Session created', { sessionId: result.session.sessionId });

      return result.session.sessionId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: errorMessage,
      }));
      console.error('[useChatHistory] ❌ Error creating session', { error: errorMessage });
      throw error;
    }
  }, [userId]);

  /**
   * Save a message exchange
   */
  const saveMessage = useCallback(async (
    input: SaveMessageInput
  ): Promise<{ sessionId: string; isNewSession: boolean }> => {
    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      const result = await saveMessageApi(input);

      // Update sessions list
      setState(prev => {
        const updatedSessions = [...prev.sessions];
        const existingIndex = updatedSessions.findIndex(
          s => s.sessionId === result.session.sessionId
        );

        const sessionSummary: ChatSessionSummary = {
          _id: result.session.sessionId,
          userId: userId || '',
          sessionId: result.session.sessionId,
          title: result.session.title,
          isActive: result.session.isActive,
          page: result.session.page,
          messageCount: result.session.messageCount,
          createdAt: result.session.createdAt,
          updatedAt: result.session.updatedAt,
          lastMessageAt: result.session.updatedAt,
          lastMessage: input.aiResponse.substring(0, 100),
        };

        if (existingIndex >= 0) {
          // Update existing session
          updatedSessions[existingIndex] = sessionSummary;
          // Move to top if not already
          if (existingIndex > 0) {
            updatedSessions.splice(existingIndex, 1);
            updatedSessions.unshift(sessionSummary);
          }
        } else {
          // Add new session at top
          updatedSessions.unshift(sessionSummary);
        }

        return {
          ...prev,
          sessions: updatedSessions,
          activeSessionId: result.session.sessionId,
          isSaving: false,
          totalSessions: result.isNewSession ? prev.totalSessions + 1 : prev.totalSessions,
        };
      });

      console.log('[useChatHistory] ✅ Message saved', {
        sessionId: result.session.sessionId,
        isNewSession: result.isNewSession,
      });

      return {
        sessionId: result.session.sessionId,
        isNewSession: result.isNewSession,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save message';
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: errorMessage,
      }));
      console.error('[useChatHistory] ❌ Error saving message', { error: errorMessage });
      throw error;
    }
  }, [userId]);

  /**
   * Switch to a different session
   */
  const switchSession = useCallback(async (sessionId: string): Promise<void> => {
    if (sessionId === state.activeSessionId) {
      return; // Already active
    }
    await loadSession(sessionId);
  }, [state.activeSessionId, loadSession]);

  /**
   * Delete a session
   */
  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      await deleteSessionApi(sessionId);

      setState(prev => {
        const updatedSessions = prev.sessions.filter(s => s.sessionId !== sessionId);
        const isActiveDeleted = prev.activeSessionId === sessionId;

        return {
          ...prev,
          sessions: updatedSessions,
          activeSession: isActiveDeleted ? null : prev.activeSession,
          activeSessionId: isActiveDeleted ? null : prev.activeSessionId,
          isSaving: false,
          totalSessions: prev.totalSessions - 1,
        };
      });

      console.log('[useChatHistory] ✅ Session deleted', { sessionId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete session';
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: errorMessage,
      }));
      console.error('[useChatHistory] ❌ Error deleting session', { sessionId, error: errorMessage });
      throw error;
    }
  }, []);

  /**
   * Clear messages from a session
   */
  const clearSessionFn = useCallback(async (sessionId: string): Promise<void> => {
    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      await clearSessionApi(sessionId);

      setState(prev => {
        // Update session in list
        const updatedSessions = prev.sessions.map(s => 
          s.sessionId === sessionId 
            ? { ...s, messageCount: 0, title: 'New Chat', lastMessage: undefined }
            : s
        );

        // Update active session if it's the one being cleared
        const updatedActiveSession = prev.activeSession?.sessionId === sessionId
          ? { ...prev.activeSession, messages: [], messageCount: 0, title: 'New Chat' }
          : prev.activeSession;

        return {
          ...prev,
          sessions: updatedSessions,
          activeSession: updatedActiveSession,
          isSaving: false,
        };
      });

      console.log('[useChatHistory] ✅ Session cleared', { sessionId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear session';
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: errorMessage,
      }));
      console.error('[useChatHistory] ❌ Error clearing session', { sessionId, error: errorMessage });
      throw error;
    }
  }, []);

  /**
   * Get AI context for a session
   */
  const getContext = useCallback(async (
    sessionId: string,
    maxMessages: number = 20
  ): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> => {
    try {
      const result = await getSessionContext(sessionId, maxMessages);
      return result.context.messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
    } catch (error) {
      console.error('[useChatHistory] ❌ Error getting context', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }, []);

  /**
   * Add message to local state (for immediate UI update before save completes)
   */
  const addLocalMessage = useCallback((message: Omit<ChatMessage, '_id'>): void => {
    setState(prev => {
      if (!prev.activeSession) return prev;

      // Generate unique ID with timestamp and random component to avoid collisions
      const uniqueId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newMessage: ChatMessage = {
        ...message,
        _id: uniqueId,
      };

      return {
        ...prev,
        activeSession: {
          ...prev.activeSession,
          messages: [...prev.activeSession.messages, newMessage],
          messageCount: prev.activeSession.messageCount + 1,
        },
      };
    });
  }, []);

  // Auto-load sessions on mount if enabled
  useEffect(() => {
    if (autoLoad && userId) {
      loadSessions(1, defaultPageFilter);
    }
  }, [autoLoad, userId, defaultPageFilter, loadSessions]);

  return {
    // State
    ...state,
    // Methods
    loadSessions,
    loadMoreSessions,
    loadSession,
    createSession,
    saveMessage,
    switchSession,
    deleteSession,
    clearSession: clearSessionFn,
    getContext,
    addLocalMessage,
    clearError,
    reset,
  };
}

export default useChatHistory;
