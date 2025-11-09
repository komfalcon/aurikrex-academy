import rateLimit from 'express-rate-limit';
import { log } from '../utils/logger';

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      status: 'error',
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

// Stricter limit for AI-intensive operations (lesson generation)
export const lessonGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 lesson generations per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.warn('Lesson generation rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      status: 'error',
      message: 'Lesson generation limit reached, please try again later.',
      code: 'LESSON_GENERATION_LIMIT_EXCEEDED',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

// Rate limit for analytics operations
export const analyticsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.warn('Analytics rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      status: 'error',
      message: 'Too many analytics requests, please try again later.',
      code: 'ANALYTICS_LIMIT_EXCEEDED',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});