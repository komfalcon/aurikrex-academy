import rateLimit from 'express-rate-limit';
import { log } from '../utils/logger.js';
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
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
            retryAfter: res.getHeader('Retry-After')
        });
    }
});
// Stricter limit for AI-intensive operations
export const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Limit each IP to 50 AI requests per hour
    message: 'AI request limit reached, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        log.warn('AI rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            method: req.method
        });
        res.status(429).json({
            status: 'error',
            message: 'AI request limit reached, please try again later.',
            retryAfter: res.getHeader('Retry-After')
        });
    }
});
//# sourceMappingURL=rate-limit.middleware.js.map