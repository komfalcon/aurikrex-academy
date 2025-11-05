import { AIProvider, AIServiceConfig, AIResponse, AIError, AICache, TaskType, TaskRouter, ContentValidation, ImageAnalysis, AIModel } from '../types/ai.types.js';
import { LessonInput, Lesson } from '../types/lesson.types.js';
declare class RedisCache implements AICache {
    private readonly redis;
    private readonly prefix;
    constructor(redisUrl?: string);
    get(key: string): Promise<AIResponse | null>;
    set(key: string, value: AIResponse, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
}
declare class SmartTaskRouter implements TaskRouter {
    route(taskType: TaskType, input: unknown): Promise<AIModel>;
    private routeLessonGeneration;
    private routeContentReview;
}
declare abstract class BaseAIProvider implements AIProvider {
    protected config: AIServiceConfig;
    protected cache: AICache;
    constructor(config: AIServiceConfig, cache?: AICache);
    protected withRetry<T>(operation: () => Promise<T>): Promise<T>;
    protected isRetryableError(error: unknown): boolean;
    protected wait(attempt: number): Promise<void>;
    protected wrapError(error: unknown): AIError;
    protected getErrorCode(error: Error): string;
    abstract generateLesson(input: LessonInput): Promise<AIResponse<Lesson>>;
    abstract validateContent(content: string): Promise<AIResponse<ContentValidation>>;
    abstract generateExplanation(query: string, context?: string): Promise<AIResponse<string>>;
    abstract analyzeImage?(imageUrl: string, prompt: string): Promise<AIResponse<ImageAnalysis>>;
}
declare const defaultConfig: AIServiceConfig;
export { BaseAIProvider, RedisCache, SmartTaskRouter, defaultConfig };
