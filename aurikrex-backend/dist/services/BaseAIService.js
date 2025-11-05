import { Redis } from 'ioredis';
import { log } from '../utils/logger.js';
// Forward declarations are not needed since we're using TypeScript imports
class RedisCache {
    redis;
    prefix = 'ai_cache:';
    constructor(redisUrl) {
        this.redis = redisUrl
            ? new Redis(redisUrl)
            : new Redis({
                host: 'localhost',
                port: 6379,
                lazyConnect: true // Don't connect immediately
            });
    }
    async get(key) {
        const cached = await this.redis.get(this.prefix + key);
        return cached ? JSON.parse(cached) : null;
    }
    async set(key, value, ttl) {
        const serialized = JSON.stringify(value);
        if (ttl) {
            await this.redis.setex(this.prefix + key, ttl, serialized);
        }
        else {
            await this.redis.set(this.prefix + key, serialized);
        }
    }
    async delete(key) {
        await this.redis.del(this.prefix + key);
    }
}
class SmartTaskRouter {
    async route(taskType, input) {
        switch (taskType) {
            case 'lesson_generation':
                return this.routeLessonGeneration(input);
            case 'content_review':
                return this.routeContentReview(input);
            case 'multimodal_content':
                return 'gemini-pro';
            default:
                return 'gpt-3.5-turbo';
        }
    }
    async routeLessonGeneration(input) {
        // Use GPT-4 for complex lessons or advanced topics
        if (input.targetGrade >= 9 || input.difficulty === 'advanced') {
            return 'gpt-4';
        }
        // Use GPT-3.5 for simpler lessons
        return 'gpt-3.5-turbo';
    }
    async routeContentReview(_content) {
        // Use Claude for ethical content review (when available)
        if (process.env.CLAUDE_API_KEY) {
            return 'claude-3';
        }
        return 'gpt-3.5-turbo';
    }
}
class BaseAIProvider {
    config;
    cache;
    constructor(config, cache) {
        this.config = config;
        this.cache = cache || new RedisCache(process.env.REDIS_URL || 'redis://localhost:6379');
    }
    async withRetry(operation) {
        let lastError = null;
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                return await Promise.race([
                    operation(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), this.config.timeout))
                ]);
            }
            catch (error) {
                lastError = error;
                if (!this.isRetryableError(error)) {
                    throw this.wrapError(error);
                }
                await this.wait(attempt);
                log.warn(`Retry attempt ${attempt} for AI operation`, { error: lastError.message });
            }
        }
        throw this.wrapError(lastError || new Error('Maximum retries reached'));
    }
    isRetryableError(error) {
        const err = error;
        return err.message.includes('rate limit') ||
            err.message.includes('timeout') ||
            err.message.includes('network');
    }
    wait(attempt) {
        const delay = Math.min(100 * Math.pow(2, attempt), 2000); // Exponential backoff
        return new Promise(resolve => setTimeout(resolve, delay));
    }
    wrapError(error) {
        const err = error;
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
    getErrorCode(error) {
        if (error.message.includes('rate limit'))
            return 'RATE_LIMIT_EXCEEDED';
        if (error.message.includes('timeout'))
            return 'OPERATION_TIMEOUT';
        if (error.message.includes('network'))
            return 'NETWORK_ERROR';
        if (error.message.includes('invalid'))
            return 'INVALID_REQUEST';
        return 'UNKNOWN_ERROR';
    }
}
const defaultConfig = {
    model: 'gpt-3.5-turbo',
    maxRetries: 3,
    timeout: 30000,
    temperature: 0.7,
    cacheDuration: 3600 // 1 hour
};
export { BaseAIProvider, RedisCache, SmartTaskRouter, defaultConfig };
//# sourceMappingURL=BaseAIService.js.map