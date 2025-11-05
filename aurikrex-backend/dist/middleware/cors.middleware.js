import cors from 'cors';
import { log } from '../utils/logger.js';
// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
        const isLocalhost = !origin || origin.includes('localhost') || origin.includes('127.0.0.1');
        if (isLocalhost || (origin && allowedOrigins.includes(origin))) {
            callback(null, true);
        }
        else {
            callback(new Error('CORS not allowed'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // 24 hours
};
// Custom CORS error handler
export const corsErrorHandler = (err, req, res) => {
    if (err.message === 'CORS not allowed') {
        log.warn('CORS request blocked:', {
            origin: req.headers.origin,
            path: req.path,
            ip: req.ip
        });
        res.status(403).json({
            error: 'CORS not allowed',
            message: 'Origin not allowed'
        });
    }
    else {
        log.error('CORS error:', { error: err.message });
        res.status(500).json({
            error: 'Internal server error',
            message: 'An unexpected error occurred'
        });
    }
};
export const corsMiddleware = cors(corsOptions);
//# sourceMappingURL=cors.middleware.js.map