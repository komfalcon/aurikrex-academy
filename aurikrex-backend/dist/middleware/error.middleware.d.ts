import { Request, Response, NextFunction } from 'express';
/**
 * Global error handling middleware
 */
export declare function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void;
/**
 * Handle 404 Not Found errors
 */
export declare function notFoundHandler(req: Request, res: Response): void;
/**
 * Handle validation errors
 */
export declare function validationErrorHandler(error: Error, _req: Request, res: Response, next: NextFunction): void;
/**
 * Handle syntax errors in JSON parsing
 */
export declare function syntaxErrorHandler(error: Error, _req: Request, res: Response, next: NextFunction): void;
/**
 * Handle uncaught promise rejections
 */
export declare function setupUncaughtHandlers(): void;
