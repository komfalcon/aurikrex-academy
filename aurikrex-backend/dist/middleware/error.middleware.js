import { AppError } from '../utils/errors.js';
import { log } from '../utils/logger.js';
/**
 * Global error handling middleware
 */
export function errorHandler(error, req, res, _next) {
    // Log the error
    log.error('Error occurred:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
    });
    // Handle known application errors
    if (error instanceof AppError) {
        res.status(error.status).json(error.toJSON());
        return;
    }
    // Handle unknown errors
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json({
        error: {
            name: 'InternalServerError',
            message: isProduction
                ? 'An unexpected error occurred'
                : error.message,
            code: 'internal_server_error',
            ...(isProduction ? {} : { stack: error.stack })
        }
    });
}
/**
 * Handle 404 Not Found errors
 */
export function notFoundHandler(req, res) {
    res.status(404).json({
        error: {
            name: 'NotFoundError',
            message: `Cannot ${req.method} ${req.path}`,
            code: 'route_not_found',
            status: 404
        }
    });
}
/**
 * Handle validation errors
 */
export function validationErrorHandler(error, _req, res, next) {
    if (error.name === 'ValidationError') {
        res.status(400).json({
            error: {
                name: 'ValidationError',
                message: error.message,
                code: 'validation_error',
                status: 400,
                details: error
            }
        });
        return;
    }
    next(error);
}
/**
 * Handle syntax errors in JSON parsing
 */
export function syntaxErrorHandler(error, _req, res, next) {
    if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
        res.status(400).json({
            error: {
                name: 'SyntaxError',
                message: 'Invalid JSON payload',
                code: 'invalid_json',
                status: 400
            }
        });
        return;
    }
    next(error);
}
/**
 * Handle uncaught promise rejections
 */
export function setupUncaughtHandlers() {
    process.on('unhandledRejection', (reason) => {
        log.error('Unhandled Promise Rejection:', {
            error: reason instanceof Error ? reason : String(reason)
        });
    });
    process.on('uncaughtException', (error) => {
        log.error('Uncaught Exception:', {
            error: error.message,
            stack: error.stack
        });
        // Give the logger time to write before exiting
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    });
}
//# sourceMappingURL=error.middleware.js.map