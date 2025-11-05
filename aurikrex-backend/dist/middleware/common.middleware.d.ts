import { Request, Response, NextFunction } from 'express';
export declare const createRateLimiter: (options: {
    windowMs?: number;
    max?: number;
    message?: string;
}) => import("express-rate-limit").RateLimitRequestHandler;
export declare const requestTracker: (req: Request, res: Response, next: NextFunction) => void;
export declare const compressionMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
