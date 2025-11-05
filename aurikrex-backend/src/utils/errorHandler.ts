import { Response } from 'express';
import { log } from './logger.js';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AIServiceError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 503, 'AI_SERVICE_ERROR', details);
    this.name = 'AIServiceError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export function handleError(error: Error | AppError, res: Response): void {
  if (error instanceof AppError) {
    log.error(`${error.name}:`, {
      message: error.message,
      code: error.code,
      details: error.details
    });

    res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      code: error.code,
      details: error.details
    });
  } else {
    log.error('Unhandled error:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}