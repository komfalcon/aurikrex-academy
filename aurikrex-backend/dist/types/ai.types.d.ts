import { Lesson, LessonInput } from './lesson.types.js';
export type AIModel = 'gpt-4' | 'gpt-3.5-turbo' | 'gemini-pro' | 'claude-3';
export interface AIServiceConfig {
    model: AIModel;
    maxRetries: number;
    timeout: number;
    temperature?: number;
    cacheDuration?: number;
}
export interface AIResponse<T = any> {
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
export type TaskType = 'lesson_generation' | 'content_review' | 'answer_validation' | 'explanation_generation' | 'multimodal_content';
export interface TaskRouter {
    route(taskType: TaskType, input: unknown): Promise<AIModel>;
}
export interface AICache {
    get(key: string): Promise<AIResponse | null>;
    set(key: string, value: AIResponse, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
}
export interface AIProvider {
    generateLesson(input: LessonInput): Promise<AIResponse<Lesson>>;
    validateContent(content: string): Promise<AIResponse<ContentValidation>>;
    generateExplanation(query: string, context?: string): Promise<AIResponse<string>>;
    analyzeImage?(imageUrl: string, prompt: string): Promise<AIResponse<ImageAnalysis>>;
}
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
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    provider: AIModel;
}
