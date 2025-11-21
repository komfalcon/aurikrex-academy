import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { log } from '../utils/logger.js';

// Extend Express Request type to include user (overriding passport's User type)
declare global {
  namespace Express {
    // Override the User type from passport to be TokenPayload
    interface User extends TokenPayload {}
    
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      log.warn('⚠️ No authorization header provided', {
        path: req.path,
        method: req.method
      });
      res.status(401).json({
        status: 'error',
        message: 'No authorization token provided'
      });
      return;
    }

    // Extract token from "Bearer <token>" format
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      log.warn('⚠️ Invalid authorization header format', {
        path: req.path,
        method: req.method
      });
      res.status(401).json({
        status: 'error',
        message: 'Invalid authorization header format. Use: Bearer <token>'
      });
      return;
    }

    const token = parts[1];

    // Verify token
    const decoded = verifyToken(token);
    
    // Attach user to request
    req.user = decoded;

    log.info('✅ User authenticated successfully', {
      userId: decoded.userId,
      role: decoded.role,
      path: req.path
    });

    next();
  } catch (error) {
    log.error('❌ Authentication failed', {
      error: error instanceof Error ? error.message : String(error),
      path: req.path,
      method: req.method
    });

    res.status(401).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Authentication failed'
    });
  }
};

/**
 * Middleware to check if user has specific role(s)
 */
export const authorize = (...allowedRoles: Array<'student' | 'instructor' | 'admin'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      log.warn('⚠️ Authorization attempted without authentication', {
        path: req.path,
        method: req.method
      });
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      log.warn('⚠️ User does not have required role', {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path
      });
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this resource'
      });
      return;
    }

    log.info('✅ User authorized successfully', {
      userId: req.user.userId,
      role: req.user.role,
      path: req.path
    });

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // Invalid format, continue without authentication
      next();
      return;
    }

    const token = parts[1];
    const decoded = verifyToken(token);
    req.user = decoded;

    log.info('✅ Optional authentication successful', {
      userId: decoded.userId,
      path: req.path
    });

    next();
  } catch (error) {
    // Token verification failed, continue without authentication
    log.warn('⚠️ Optional authentication failed, continuing without auth', {
      error: error instanceof Error ? error.message : String(error),
      path: req.path
    });
    next();
  }
};
