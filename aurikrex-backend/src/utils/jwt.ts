import jwt, { JwtPayload, SignOptions, Secret } from 'jsonwebtoken';
import { StringValue } from 'ms';
import { log } from './logger.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
}

export interface DecodedToken extends JwtPayload {
  userId: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Initialize and validate JWT_SECRET at module load
const jwtSecretEnv = process.env.JWT_SECRET;
if (!jwtSecretEnv || jwtSecretEnv.length < 32) {
  throw new Error('JWT_SECRET environment variable is required and must be at least 32 characters');
}
const JWT_SECRET: Secret = jwtSecretEnv;
const ACCESS_TOKEN_EXPIRY: StringValue = (process.env.ACCESS_TOKEN_EXPIRY || '1h') as StringValue;
const REFRESH_TOKEN_EXPIRY: StringValue = (process.env.REFRESH_TOKEN_EXPIRY || '7d') as StringValue;

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  try {
    const options: SignOptions = {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'aurikrex-academy',
      audience: 'aurikrex-api'
    };
    
    const token = jwt.sign(payload, JWT_SECRET, options);

    log.info('Access token generated', { userId: payload.userId });
    return token;
  } catch (error) {
    log.error('Error generating access token', {
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
    const options: SignOptions = {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'aurikrex-academy',
      audience: 'aurikrex-api'
    };
    
    const token = jwt.sign(payload, JWT_SECRET, options);

    log.info('Refresh token generated', { userId: payload.userId });
    return token;
  } catch (error) {
    log.error('Error generating refresh token', {
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
    }) as DecodedToken;

    log.info('Token verified successfully', { userId: decoded.userId });
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      log.warn('Token expired', { expiredAt: error.expiredAt });
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      log.warn('Invalid token', { error: error.message });
      throw new Error('Invalid token');
    }
    
    log.error('Error verifying token', {
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
    const decoded = jwt.decode(token) as DecodedToken | null;
    if (!decoded) return null;
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    log.error('Error decoding token', {
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
    const decoded = jwt.decode(token) as DecodedToken | null;
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
}
