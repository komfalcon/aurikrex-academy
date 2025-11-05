import { log } from '../utils/logger.js';
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    // Log request
    log.info('Incoming request', {
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    // Log response
    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? 'warn' : 'info';
        log[level]('Request completed', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            contentLength: res.get('content-length'),
            ip: req.ip
        });
    });
    next();
};
//# sourceMappingURL=request-logger.middleware.js.map