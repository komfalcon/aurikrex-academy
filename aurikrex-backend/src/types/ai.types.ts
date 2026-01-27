import { Lesson, LessonInput } from './lesson.types.js';

// Supported AI providers
export type AIModel = 'gemini' | 'openai' | 'openrouter' | 'groq';
export type AIProviderType = 'gemini' | 'openai' | 'openrouter' | 'groq';

export interface AIServiceConfig {
  model: AIModel;
  maxRetries: number;
  timeout: number; // in milliseconds
  temperature?: number;
  cacheDuration?: number; // in seconds
}

export interface AIResponse<T = unknown> {
  data: T;
  model: AIModel;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cached?: boolean;
  generatedAt: Date;
}

export interface AIError extends Error {
  code: string;
  model?: AIModel;
  retryable: boolean;
  context?: unknown;
}

// Task-specific types
export type TaskType = 
  | 'lesson_generation' 
  | 'content_review'
  | 'answer_validation' 
  | 'explanation_generation'
  | 'multimodal_content';

export interface TaskRouter {
  route(taskType: TaskType, input: unknown): Promise<AIModel>;
}

export interface AICache {
  get(key: string): Promise<AIResponse | null>;
  set(key: string, value: AIResponse, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

// Service interface that all AI providers must implement
export interface AIProvider {
  generateLesson(input: LessonInput): Promise<AIResponse<Lesson>>;
  validateContent(content: string): Promise<AIResponse<ContentValidation>>;
  generateExplanation(query: string, context?: string): Promise<AIResponse<string>>;
  analyzeImage?(imageUrl: string, prompt: string): Promise<AIResponse<ImageAnalysis>>;
}

// Content validation result
export interface ContentValidation {
  isAppropriate: boolean;
  confidenceScore: number;
  flags?: Array<{
    type: 'profanity' | 'bias' | 'sensitivity' | 'complexity';
    severity: 'low' | 'medium' | 'high';
    explanation: string;
  }>;
  suggestions?: string[];
}

// Image analysis result
export interface ImageAnalysis {
  description: string;
  labels: string[];
  objects: Array<{
    name: string;
    confidence: number;
  }>;
  safeSearch: {
    adult: string;
    violence: string;
    racy: string;
  };
  textDetection?: string[];
}

// Rate limiting types
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  provider: AIModel;
}

// ============================================
// AI Chat Types (Unified for Gemini/OpenAI)
// ============================================

/**
 * Context information for the AI chat request
 * Used to provide contextual information about where the chat is being used
 */
export interface AIChatContext {
  page: 'Smart Lessons' | 'Assignment' | 'Dashboard' | 'Ask FalkeAI';
  course?: string;
  username: string;
  userId: string;
}

/**
 * Request body for the internal AI chat endpoint
 */
export interface AIChatRequest {
  message: string;
  context: AIChatContext;
}

/**
 * Response from the internal AI chat endpoint
 */
export interface AIChatResponse {
  reply: string;
  timestamp: string;
  provider?: AIProviderType;
  model?: string;
  modelType?: string;
}

/**
 * Error response from the AI chat endpoint
 */
export interface AIErrorResponse {
  status: 'error';
  message: string;
  code?: string;
}

// Legacy type aliases for backwards compatibility
export type FalkeAIChatContext = AIChatContext;
export type FalkeAIChatRequest = AIChatRequest;
export type FalkeAIChatResponse = AIChatResponse;
export type FalkeAIErrorResponse = AIErrorResponse;