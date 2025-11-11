import jwt from 'jsonwebtoken';
import { log } from './logger';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '1h';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'aurikrex-academy',
      audience: 'aurikrex-api'
    });

    log.info('✅ Access token generated', { userId: payload.userId });
    return token;
  } catch (error) {
    log.error('❌ Error generating access token', {
      error: error instanceof Error ? error.message : String(error),
      userId: payload.userId
    });
    throw new Error('Failed to generate access token');
  }
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'aurikrex-academy',
      audience: 'aurikrex-api'
    });

    log.info('✅ Refresh token generated', { userId: payload.userId });
    return token;
  } catch (error) {
    log.error('❌ Error generating refresh token', {
      error: error instanceof Error ? error.message : String(error),
      userId: payload.userId
    });
    throw new Error('Failed to generate refresh token');
  }
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: TokenPayload): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'aurikrex-academy',
      audience: 'aurikrex-api'
    }) as TokenPayload;

    log.info('✅ Token verified successfully', { userId: decoded.userId });
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      log.warn('⚠️ Token expired', { expiredAt: error.expiredAt });
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      log.warn('⚠️ Invalid token', { error: error.message });
      throw new Error('Invalid token');
    }
    
    log.error('❌ Error verifying token', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw new Error('Token verification failed');
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch (error) {
    log.error('❌ Error decoding token', {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}
