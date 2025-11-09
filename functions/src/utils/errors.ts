interface AppErrorOptions {
  code?: string;
  status?: number;
  details?: unknown;
  cause?: unknown;
}

// Base error class for application errors
export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;
  public readonly cause?: unknown;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || 'UNKNOWN_ERROR';
    this.status = options.status || 500;
    this.details = options.details;
    this.cause = options.cause;
    
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON(): Record<string, unknown> {
    const errorJson: Record<string, unknown> = {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status
    };

    if (this.details !== undefined) {
      errorJson.details = this.details;
    }

    if (this.cause instanceof Error) {
      errorJson.cause = {
        name: this.cause.name,
        message: this.cause.message,
        ...(this.cause instanceof AppError && { code: this.cause.code })
      };
    } else if (this.cause) {
      errorJson.cause = this.cause;
    }

    return { error: errorJson };
  }


}

// Firebase-specific errors
export class FirebaseError extends AppError {
  constructor(
    message: string,
    code: string,
    options: Omit<AppErrorOptions, 'code'> = {}
  ) {
    super(message, {
      ...options,
      code: `firebase/${code}`,
      status: options.status || 500
    });
  }
}

// Authentication errors
export class AuthError extends AppError {
  constructor(
    message: string,
    code: string,
    status: number = 401,
    details?: unknown
  ) {
    super(message, {
      code: `auth/${code}`,
      status,
      details
    });
  }
}

// Validation errors
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, {
      code: 'validation_error',
      status: 400,
      details
    });
  }
}

// Not found errors
export class NotFoundError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, {
      code: 'not_found',
      status: 404,
      details
    });
  }
}

// Storage errors
export class StorageError extends AppError {
  constructor(
    message: string,
    code: string,
    options: Omit<AppErrorOptions, 'code'> = {}
  ) {
    super(message, {
      ...options,
      code: `storage/${code}`,
      status: options.status || 500
    });
  }
}

/**
 * Extracts a human-readable error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return `${error.name}: ${error.message} (${error.code})`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

/**
 * Maps Firebase Admin errors to our custom error types
 */
export function mapFirebaseError(error: unknown): AppError {
  if (!error) {
    return new AppError('Unknown error', { code: 'unknown_error' });
  }

  if (!(error instanceof Error)) {
    return new AppError('Unknown error format', { 
      code: 'invalid_error_format',
      details: error 
    });
  }

  const errorWithCode = error as Error & { code?: string };

  // Map Firebase Auth errors
  if (errorWithCode.code?.startsWith('auth/')) {
    const code = errorWithCode.code.replace('auth/', '');
    const status = getAuthErrorStatusCode(code);
    return new AuthError(error.message, code, status);
  }

  // Map Firestore errors
  if (errorWithCode.code?.startsWith('firestore/')) {
    const code = errorWithCode.code.replace('firestore/', '');
    return new FirebaseError(error.message, code);
  }

  // Map Storage errors
  if (errorWithCode.code?.startsWith('storage/')) {
    const code = errorWithCode.code.replace('storage/', '');
    return new StorageError(error.message, code);
  }

  // Generic Firebase errors
  return new FirebaseError(
    error.message || 'Firebase operation failed',
    errorWithCode.code || 'unknown_error'
  );
}

/**
 * Gets the appropriate HTTP status code for auth errors
 */
function getAuthErrorStatusCode(code: string): number {
  const statusCodes: Record<string, number> = {
    'user-not-found': 404,
    'wrong-password': 401,
    'email-already-in-use': 409,
    'invalid-email': 400,
    'weak-password': 400,
    'operation-not-allowed': 403,
    'user-disabled': 403,
    'invalid-credential': 401,
    'account-exists-with-different-credential': 409,
    'invalid-verification-code': 400,
    'invalid-verification-id': 400,
    'expired-action-code': 400,
    'invalid-action-code': 400,
    'missing-verification-code': 400,
    'missing-verification-id': 400,
    'credential-already-in-use': 409
  };

  return statusCodes[code] || 500;
}

/**
 * Wraps an async function with error handling
 */
export function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMapper?: (error: unknown) => AppError
): Promise<T> {
  return fn().catch((error) => {
    if (errorMapper) {
      throw errorMapper(error);
    }
    if (error instanceof AppError) {
      throw error;
    }
    throw mapFirebaseError(error);
  });
}