interface AppErrorOptions {
    code?: string;
    status?: number;
    details?: unknown;
    cause?: unknown;
}
export declare class AppError extends Error {
    readonly code: string;
    readonly status: number;
    readonly details?: unknown;
    constructor(message: string, options?: AppErrorOptions);
    toJSON(): Record<string, unknown>;
}
export declare class FirebaseError extends AppError {
    constructor(message: string, code: string, options?: Omit<AppErrorOptions, 'code'>);
}
export declare class AuthError extends AppError {
    constructor(message: string, code: string, status?: number, details?: unknown);
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: unknown);
}
export declare class NotFoundError extends AppError {
    constructor(message: string, details?: unknown);
}
export declare class StorageError extends AppError {
    constructor(message: string, code: string, options?: Omit<AppErrorOptions, 'code'>);
}
/**
 * Extracts a human-readable error message from various error types
 */
export declare function getErrorMessage(error: unknown): string;
/**
 * Maps Firebase Admin errors to our custom error types
 */
export declare function mapFirebaseError(error: unknown): AppError;
/**
 * Wraps an async function with error handling
 */
export declare function withErrorHandling<T>(fn: () => Promise<T>, errorMapper?: (error: unknown) => AppError): Promise<T>;
export {};
