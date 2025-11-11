import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { ExtendedRequest } from '../types/api.types.js';
import { log } from '../utils/logger.js';

// Separate rate limits for different endpoints
export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
}) => rateLimit({
  windowMs: options.windowMs || 15 * 60 * 1000, // Default: 15 minutes
  max: options.max || 100, // Default: 100 requests per windowMs
  message: options.message || 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Send standard rate limit headers
  legacyHeaders: false, // Disable legacy rate limit headers
  skipSuccessfulRequests: false, // Count successful requests against the rate limit
  // Skip rate limiting for whitelisted IPs
  skip: (req) => {
    const whitelist = process.env.IP_WHITELIST?.split(',') || [];
    const requestIp = req.ip || req.socket.remoteAddress || '';
    return whitelist.includes(requestIp);
  }
});

// Request tracking middleware
export const requestTracker = (req: Request, res: Response, next: NextFunction) => {
  try {
    const extendedReq = req as ExtendedRequest;
    extendedReq.context = {
      requestId: randomUUID(),
      startTime: Date.now(),
      path: req.path,
      method: req.method,
      ip: req.ip || req.socket.remoteAddress || 'unknown'
    };
    
    // Log request start
    log.info(`Request started: [${extendedReq.context.requestId}]`, {
      method: req.method,
      path: req.path,
      ip: extendedReq.context.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Log request end
    res.on('finish', () => {
      const duration = Date.now() - extendedReq.context.startTime;
      const logLevel = res.statusCode >= 400 ? 'error' : 'info';
      
      log[logLevel](`Request completed: [${extendedReq.context.requestId}]`, {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: extendedReq.context.ip
      });
    });

    next();
  } catch (error) {
    log.error('Error in request tracking middleware:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
      method: req.method
    });
    next(error);
  }
};

// Compression middleware
export const compressionMiddleware = compression({
  // Only compress responses larger than 1KB
  threshold: 1024,
  
  // Don't compress responses that have a Cache-Control header with no-transform
  filter: (req, res) => {
    // Skip compression if explicitly disabled
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Skip compression for already compressed content types
    const contentType = res.getHeader('Content-Type') as string;
    if (contentType && (
      contentType.includes('image/') ||
      contentType.includes('video/') ||
      contentType.includes('audio/') ||
      contentType.includes('application/zip') ||
      contentType.includes('application/x-gzip')
    )) {
      return false;
    }

    return compression.filter(req, res);
  },

  // Compression level (0-9)
  // 1 = fastest, worst compression
  // 9 = slowest, best compression
  // 4 = default compromise
  level: 4
});