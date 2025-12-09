/**
 * Utility functions for sanitizing sensitive data in logs
 */

/**
 * Sanitize email address for logging
 * In production, only show first 3 characters and domain
 * In development, show full email
 * 
 * @param email - Email address to sanitize
 * @returns Sanitized email string
 * 
 * @example
 * sanitizeEmail('user@example.com') // dev: 'user@example.com', prod: 'use***@example.com'
 */
export function sanitizeEmail(email: string): string {
  if (process.env.NODE_ENV === 'development') {
    return email;
  }
  
  if (!email || !email.includes('@')) {
    return '***';
  }
  
  const [localPart, domain] = email.split('@');
  const sanitizedLocal = localPart.length > 3 
    ? `${localPart.substring(0, 3)}***` 
    : '***';
  
  return `${sanitizedLocal}@${domain}`;
}

/**
 * Sanitize object containing email field for logging
 * 
 * @param obj - Object that may contain email field
 * @returns Object with sanitized email if present
 */
export function sanitizeLogObject(obj: Record<string, any>): Record<string, any> {
  if (!obj) {
    return obj;
  }
  
  const sanitized = { ...obj };
  
  if (sanitized.email) {
    sanitized.email = sanitizeEmail(sanitized.email);
  }
  
  return sanitized;
}

/**
 * Sanitize user ID for logging
 * In production, only show first and last 4 characters
 * In development, show full ID
 * 
 * @param userId - User ID to sanitize
 * @returns Sanitized user ID string
 */
export function sanitizeUserId(userId: string): string {
  if (process.env.NODE_ENV === 'development') {
    return userId;
  }
  
  if (!userId || userId.length <= 8) {
    return '***';
  }
  
  return `${userId.substring(0, 4)}...${userId.substring(userId.length - 4)}`;
}
