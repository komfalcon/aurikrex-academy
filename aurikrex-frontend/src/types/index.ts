// src/types/index.ts
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

// ============================================
// FalkeAI Chat Types
// ============================================

/**
 * Valid page values for the FalkeAI chat context
 */
export type FalkeAIChatPage = 'Smart Lessons' | 'Assignment' | 'Dashboard' | 'Ask FalkeAI';

/**
 * Context information for the FalkeAI chat request
 * Used to provide contextual information about where the chat is being used
 */
export interface FalkeAIChatContext {
  page: FalkeAIChatPage;
  course?: string;
  username: string;
  userId: string;
}

/**
 * Request body for the AI chat endpoint
 */
export interface FalkeAIChatRequest {
  message: string;
  context: FalkeAIChatContext;
}

/**
 * Response from the AI chat endpoint
 */
export interface FalkeAIChatResponse {
  reply: string;
  timestamp: string;
}

/**
 * Error response from the AI chat endpoint
 */
export interface FalkeAIErrorResponse {
  status: 'error';
  message: string;
  code?: string;
}