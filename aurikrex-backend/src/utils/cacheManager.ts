import { Redis } from 'ioredis';
import { log } from './logger.js';
import type { Lesson } from '../types/lesson.types.js';

const CACHE_TTL = 30 * 60; // 30 minutes in seconds

class CacheManager {
  private redis: Redis;
  private static instance: CacheManager;

  private constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.redis.on('error', (err) => {
      log.error('Redis connection error:', err);
    });
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async setLesson(key: string, lesson: Lesson): Promise<void> {
    try {
      await this.redis.setex(
        `lesson:${key}`,
        CACHE_TTL,
        JSON.stringify(lesson)
      );
    } catch (error) {
      log.error('Cache set error:', { error: String(error) });
    }
  }

  async getLesson(key: string): Promise<Lesson | null> {
    try {
      const cached = await this.redis.get(`lesson:${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      log.error('Cache get error:', { error: String(error) });
      return null;
    }
  }

  async setLessonsList(key: string, lessons: Lesson[]): Promise<void> {
    try {
      await this.redis.setex(
        `lessons:${key}`,
        CACHE_TTL,
        JSON.stringify(lessons)
      );
    } catch (error) {
      log.error('Cache set list error:', { error: String(error) });
    }
  }

  async getLessonsList(key: string): Promise<Lesson[] | null> {
    try {
      const cached = await this.redis.get(`lessons:${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      log.error('Cache get list error:', { error: String(error) });
      return null;
    }
  }

  async invalidateLesson(key: string): Promise<void> {
    try {
      await this.redis.del(`lesson:${key}`);
    } catch (error) {
      log.error('Cache invalidation error:', { error: String(error) });
    }
  }
}

export const cacheManager = CacheManager.getInstance();