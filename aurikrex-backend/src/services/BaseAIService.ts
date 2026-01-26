import { Redis } from 'ioredis';
import { log } from '../utils/logger.js';
import { 
  AIProvider, 
  AIServiceConfig,
  AIResponse,
  AIError,
  AICache,
  TaskType,
  TaskRouter,
  ContentValidation,
  ImageAnalysis,
  AIModel
} from '../types/ai.types.js';
import { LessonInput, Lesson } from '../types/lesson.types.js';

// Forward declarations are not needed since we're using TypeScript imports

class RedisCache implements AICache {
  private readonly redis: Redis;
  private readonly prefix = 'ai_cache:';

  constructor(redisUrl?: string) {
    this.redis = redisUrl 
      ? new Redis(redisUrl)
      : new Redis({
          host: 'localhost',
          port: 6379,
          lazyConnect: true // Don't connect immediately
        });
  }

  async get(key: string): Promise<AIResponse | null> {
    const cached = await this.redis.get(this.prefix + key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: AIResponse, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(this.prefix + key, ttl, serialized);
    } else {
      await this.redis.set(this.prefix + key, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(this.prefix + key);
  }
}

/**
 * SmartTaskRouter - Routes AI tasks to the appropriate model
 * With Gemini/OpenAI architecture, all tasks are routed to Gemini first with OpenAI fallback
 */
class SmartTaskRouter implements TaskRouter {
  async route(_taskType: TaskType, _input: unknown): Promise<AIModel> {
    // All tasks are now handled by Gemini (primary) or OpenAI (fallback)
    return 'gemini';
  }
}

abstract class BaseAIProvider implements AIProvider {
  protected config: AIServiceConfig;
  protected cache: AICache;
  
  constructor(config: AIServiceConfig, cache?: AICache) {
    this.config = config;
    this.cache = cache || new RedisCache(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  protected async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await Promise.race([
          operation(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Operation timed out')), this.config.timeout)
          )
        ]) as T;
      } catch (error) {
        lastError = error as Error;
        if (!this.isRetryableError(error)) {
          throw this.wrapError(error);
        }
        await this.wait(attempt);
        log.warn(`Retry attempt ${attempt} for AI operation`, { error: lastError.message });
      }
    }
    
    throw this.wrapError(lastError || new Error('Maximum retries reached'));
  }

  protected isRetryableError(error: unknown): boolean {
    const err = error as Error;
    return err.message.includes('rate limit') || 
           err.message.includes('timeout') ||
           err.message.includes('network');
  }

  protected wait(attempt: number): Promise<void> {
    const delay = Math.min(100 * Math.pow(2, attempt), 2000); // Exponential backoff
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  protected wrapError(error: unknown): AIError {
    const err = error as Error;
    return {
      name: 'AIError',
      message: err.message,
      code: this.getErrorCode(err),
      stack: err.stack,
      retryable: this.isRetryableError(err),
      model: this.config.model,
      context: error
    };
  }

  protected getErrorCode(error: Error): string {
    if (error.message.includes('rate limit')) return 'RATE_LIMIT_EXCEEDED';
    if (error.message.includes('timeout')) return 'OPERATION_TIMEOUT';
    if (error.message.includes('network')) return 'NETWORK_ERROR';
    if (error.message.includes('invalid')) return 'INVALID_REQUEST';
    return 'UNKNOWN_ERROR';
  }

  abstract generateLesson(input: LessonInput): Promise<AIResponse<Lesson>>;
  abstract validateContent(content: string): Promise<AIResponse<ContentValidation>>;
  abstract generateExplanation(query: string, context?: string): Promise<AIResponse<string>>;
  abstract analyzeImage?(imageUrl: string, prompt: string): Promise<AIResponse<ImageAnalysis>>;
}

const defaultConfig: AIServiceConfig = {
  model: 'gemini',
  maxRetries: 3,
  timeout: 90000, // 90 seconds for complex questions
  temperature: 0.7,
  cacheDuration: 3600 // 1 hour
};

export { BaseAIProvider, RedisCache, SmartTaskRouter, defaultConfig };