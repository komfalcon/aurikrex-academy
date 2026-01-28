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

// ============================================
// Prompt Engineering System Types
// ============================================

/**
 * Request types for AI interactions
 * Each type triggers different system prompts and response formatting
 */
export type AIRequestType = 'teach' | 'question' | 'review' | 'hint' | 'explanation';

/**
 * Learning style preferences
 */
export type LearningStyle = 'visual' | 'textual' | 'kinesthetic' | 'auditory';

/**
 * Knowledge level for content adaptation
 */
export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Preferred learning pace
 */
export type LearningPace = 'fast' | 'moderate' | 'slow';

/**
 * Detail level for responses
 */
export type DetailLevel = 'brief' | 'moderate' | 'detailed';

/**
 * User preferences for AI responses
 */
export interface UserPreferences {
  includeExamples: boolean;
  includeFormulas: boolean;
  detailLevel: DetailLevel;
  codeExamples: boolean;
  historicalContext: boolean;
}

/**
 * User context for personalized AI responses
 * Contains learning profile information to tailor responses
 */
export interface UserLearningContext {
  userId: string;
  learningStyle: LearningStyle;
  knowledgeLevel: KnowledgeLevel;
  preferredPace: LearningPace;
  previousTopics: string[];
  strengths: string[];
  weaknesses: string[];
  preferences: UserPreferences;
}

/**
 * Default user learning context for new users
 */
export const DEFAULT_USER_LEARNING_CONTEXT: UserLearningContext = {
  userId: '',
  learningStyle: 'textual',
  knowledgeLevel: 'beginner',
  preferredPace: 'moderate',
  previousTopics: [],
  strengths: [],
  weaknesses: [],
  preferences: {
    includeExamples: true,
    includeFormulas: true,
    detailLevel: 'moderate',
    codeExamples: true,
    historicalContext: false,
  },
};

/**
 * Prompt enhancement result
 * Contains the original request transformed into an optimal model prompt
 */
export interface PromptEnhancement {
  originalRequest: string;
  enhancedRequest: string;
  systemPrompt: string;
  context: string;
  instructions: string;
  requestType: AIRequestType;
  detectedIntent: string;
  estimatedComplexity: 'low' | 'medium' | 'high';
}

/**
 * Section type for parsed response content
 */
export type SectionType = 
  | 'text'
  | 'concept'
  | 'math'
  | 'example'
  | 'error'
  | 'solution'
  | 'misconception'
  | 'practice'
  | 'resource'
  | 'understanding'
  | 'approach'
  | 'assessment'
  | 'strength'
  | 'improvement'
  | 'feedback';

/**
 * Parsed section from AI response
 */
export interface ResponseSection {
  heading: string;
  content: string;
  type: SectionType;
}

/**
 * Structured response from AI
 */
export interface ResponseStructure {
  title?: string;
  sections: ResponseSection[];
  summary?: string;
  keyTakeaways?: string[];
  nextSteps?: string[];
}

/**
 * Refined AI response with formatting
 */
export interface RefinedResponse {
  raw: string;
  refined: string;
  formattedHtml: string;
  structure: ResponseStructure;
  requestType: AIRequestType;
}

/**
 * Extended AI chat request with request type
 */
export interface EnhancedAIChatRequest extends AIChatRequest {
  requestType?: AIRequestType;
  userLearningContext?: Partial<UserLearningContext>;
}

/**
 * Extended AI chat response with refined content
 */
export interface EnhancedAIChatResponse extends AIChatResponse {
  refined?: RefinedResponse;
  requestType?: AIRequestType;
}