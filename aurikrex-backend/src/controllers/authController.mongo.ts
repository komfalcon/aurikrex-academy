import { Request, Response } from 'express';
import { getErrorMessage } from '../utils/errors.js';
import passport from '../config/passport.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt.js';
import { log } from '../utils/logger.js';
import { sanitizeEmail } from '../utils/sanitize.js';
import { userService } from '../services/UserService.mongo.js';

/**
 * OAuth user interface for callback handlers
 */
interface OAuthUser {
  userId: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  uid: string;
  displayName?: string;
  photoURL?: string;
  provider?: string;
}

/**
 * Helper to generate OAuth redirect URL with tokens
 */
function generateOAuthRedirectUrl(
  user: OAuthUser,
  accessToken: string,
  refreshToken: string,
  frontendURL: string,
  provider: string
): string {
  return `${frontendURL}/auth/callback?` +
    `token=${encodeURIComponent(accessToken)}` +
    `&refreshToken=${encodeURIComponent(refreshToken)}` +
    `&email=${encodeURIComponent(user.email)}` +
    `&displayName=${encodeURIComponent(user.displayName || '')}` +
    `&uid=${encodeURIComponent(user.uid)}` +
    `&provider=${encodeURIComponent(provider)}`;
}

/**
 * Helper to set OAuth cookies
 */
function setOAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  frontendURL: string
): void {
  const isProduction = process.env.NODE_ENV === 'production';
  let cookieDomain: string | undefined = undefined;
  
  if (isProduction && frontendURL) {
    try {
      const hostname = new URL(frontendURL).hostname;
      cookieDomain = hostname.startsWith('www.') ? hostname.replace(/^www/, '') : `.${hostname}`;
    } catch (urlError) {
      log.warn('Failed to parse FRONTEND_URL for cookie domain', { error: getErrorMessage(urlError) });
    }
  }
  
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: cookieDomain,
  };

  res.cookie('aurikrex_token', accessToken, cookieOptions);
  res.cookie('aurikrex_refresh_token', refreshToken, cookieOptions);
}

/**
 * Helper to validate return URL from state
 */
function validateReturnUrl(state: string | undefined, frontendURL: string): string {
  if (!state) return frontendURL;
  
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    if (stateData.returnUrl) {
      const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || 'https://aurikrex.tech,https://www.aurikrex.tech';
      const allowedOrigins = [...new Set([frontendURL, ...allowedOriginsEnv.split(',').map(o => o.trim())])];
      
      const returnUrlObj = new URL(stateData.returnUrl);
      const isAllowed = allowedOrigins.some(origin => {
        const allowedUrlObj = new URL(origin);
        return returnUrlObj.hostname === allowedUrlObj.hostname;
      });
      
      if (isAllowed) {
        return stateData.returnUrl;
      }
      log.warn('Rejected returnUrl with invalid hostname', { hostname: returnUrlObj.hostname });
    }
  } catch (e) {
    log.warn('Failed to parse state', { error: getErrorMessage(e) });
  }
  
  return frontendURL;
}

// ============================================
// GOOGLE OAuth
// ============================================

/**
 * Initiate Google OAuth flow
 * Returns the Google OAuth URL for frontend to redirect to
 */
export const googleAuthInit = async (_req: Request, res: Response): Promise<void> => {
  try {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const backendURL = process.env.BACKEND_URL || 'http://localhost:5000';
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || `${backendURL}/api/auth/google/callback`;
    const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';

    if (!clientID) {
      res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured',
      });
      return;
    }

    const scopes = ['profile', 'email'];
    const state = Buffer.from(JSON.stringify({ returnUrl: frontendURL })).toString('base64');
    
    const googleAuthUrl = 
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientID)}` +
      `&redirect_uri=${encodeURIComponent(callbackURL)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes.join(' '))}` +
      `&state=${state}` +
      `&access_type=offline` +
      `&prompt=consent`;

    log.info('Google OAuth URL generated');

    res.status(200).json({
      success: true,
      data: { url: googleAuthUrl },
    });
  } catch (error) {
    log.error('Google OAuth init error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to initialize Google authentication',
      error: getErrorMessage(error),
    });
  }
};

/**
 * Handle Google OAuth callback
 */
export const googleAuthCallback = [
  passport.authenticate('google', { session: false }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as OAuthUser | undefined;
      const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';

      if (!user) {
        log.error('No user found after Google auth');
        res.redirect(`${frontendURL}/login?error=auth_failed`);
        return;
      }

      log.info('Google OAuth successful', { email: sanitizeEmail(user.email) });

      const accessToken = generateAccessToken({
        userId: user.uid,
        email: user.email,
        role: user.role || 'student',
      });
      const refreshToken = generateRefreshToken({
        userId: user.uid,
        email: user.email,
        role: user.role || 'student',
      });

      const returnUrl = validateReturnUrl(req.query.state as string, frontendURL);
      setOAuthCookies(res, accessToken, refreshToken, frontendURL);
      
      const redirectUrl = generateOAuthRedirectUrl(user, accessToken, refreshToken, returnUrl, 'google');
      
      log.info('Redirecting user to frontend', { provider: 'google' });
      res.redirect(redirectUrl);
    } catch (error) {
      log.error('Google callback error', { error: getErrorMessage(error) });
      const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';
      res.redirect(`${frontendURL}/login?error=auth_callback_failed`);
    }
  }
];

// ============================================
// MICROSOFT OAuth
// ============================================

/**
 * Initiate Microsoft OAuth flow
 * Returns the Microsoft OAuth URL for frontend to redirect to
 */
export const microsoftAuthInit = async (_req: Request, res: Response): Promise<void> => {
  try {
    const clientID = process.env.MICROSOFT_CLIENT_ID;
    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    const backendURL = process.env.BACKEND_URL || 'http://localhost:5000';
    const callbackURL = process.env.MICROSOFT_CALLBACK_URL || `${backendURL}/api/auth/microsoft/callback`;
    const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';

    if (!clientID) {
      res.status(500).json({
        success: false,
        message: 'Microsoft OAuth is not configured',
      });
      return;
    }

    const scopes = ['openid', 'profile', 'email', 'User.Read'];
    const state = Buffer.from(JSON.stringify({ returnUrl: frontendURL })).toString('base64');
    
    const microsoftAuthUrl = 
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${encodeURIComponent(clientID)}` +
      `&redirect_uri=${encodeURIComponent(callbackURL)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes.join(' '))}` +
      `&state=${state}` +
      `&response_mode=query`;

    log.info('Microsoft OAuth URL generated');

    res.status(200).json({
      success: true,
      data: { url: microsoftAuthUrl },
    });
  } catch (error) {
    log.error('Microsoft OAuth init error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to initialize Microsoft authentication',
      error: getErrorMessage(error),
    });
  }
};

/**
 * Handle Microsoft OAuth callback
 */
export const microsoftAuthCallback = [
  passport.authenticate('microsoft', { session: false }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as OAuthUser | undefined;
      const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';

      if (!user) {
        log.error('No user found after Microsoft auth');
        res.redirect(`${frontendURL}/login?error=auth_failed`);
        return;
      }

      log.info('Microsoft OAuth successful', { email: sanitizeEmail(user.email) });

      const accessToken = generateAccessToken({
        userId: user.uid,
        email: user.email,
        role: user.role || 'student',
      });
      const refreshToken = generateRefreshToken({
        userId: user.uid,
        email: user.email,
        role: user.role || 'student',
      });

      const returnUrl = validateReturnUrl(req.query.state as string, frontendURL);
      setOAuthCookies(res, accessToken, refreshToken, frontendURL);
      
      const redirectUrl = generateOAuthRedirectUrl(user, accessToken, refreshToken, returnUrl, 'microsoft');
      
      log.info('Redirecting user to frontend', { provider: 'microsoft' });
      res.redirect(redirectUrl);
    } catch (error) {
      log.error('Microsoft callback error', { error: getErrorMessage(error) });
      const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';
      res.redirect(`${frontendURL}/login?error=auth_callback_failed`);
    }
  }
];

// ============================================
// GITHUB OAuth
// ============================================

/**
 * Initiate GitHub OAuth flow
 * Returns the GitHub OAuth URL for frontend to redirect to
 */
export const githubAuthInit = async (_req: Request, res: Response): Promise<void> => {
  try {
    const clientID = process.env.GITHUB_CLIENT_ID;

    // GitHub OAuth requires environment variables to be configured
    if (!clientID) {
      log.warn('GitHub OAuth init attempted but not configured');
      res.status(503).json({
        success: false,
        message: 'GitHub sign-in is not yet available. Please use Google or Microsoft to sign in.',
        error: 'GITHUB_NOT_CONFIGURED',
      });
      return;
    }

    const backendURL = process.env.BACKEND_URL || 'http://localhost:5000';
    const callbackURL = process.env.GITHUB_CALLBACK_URL || `${backendURL}/api/auth/github/callback`;
    const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';

    const scopes = ['user:email', 'read:user'];
    const state = Buffer.from(JSON.stringify({ returnUrl: frontendURL })).toString('base64');
    
    const githubAuthUrl = 
      `https://github.com/login/oauth/authorize?` +
      `client_id=${encodeURIComponent(clientID)}` +
      `&redirect_uri=${encodeURIComponent(callbackURL)}` +
      `&scope=${encodeURIComponent(scopes.join(' '))}` +
      `&state=${state}`;

    log.info('GitHub OAuth URL generated');

    res.status(200).json({
      success: true,
      data: { url: githubAuthUrl },
    });
  } catch (error) {
    log.error('GitHub OAuth init error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to initialize GitHub authentication',
      error: getErrorMessage(error),
    });
  }
};

/**
 * Handle GitHub OAuth callback
 * Uses passport-github2 strategy when configured
 */
export const githubAuthCallback = [
  // Conditional middleware: only use passport if GitHub is configured
  (req: Request, res: Response, next: any) => {
    const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';
    
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      log.warn('GitHub OAuth callback received but GitHub OAuth is not configured');
      res.redirect(`${frontendURL}/login?error=github_not_configured`);
      return;
    }
    
    // Use passport authentication
    passport.authenticate('github', { session: false }, (err: Error | null, user: OAuthUser | undefined) => {
      if (err) {
        log.error('GitHub OAuth authentication error', { error: getErrorMessage(err) });
        res.redirect(`${frontendURL}/login?error=auth_failed`);
        return;
      }
      if (!user) {
        log.error('No user found after GitHub auth');
        res.redirect(`${frontendURL}/login?error=auth_failed`);
        return;
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as OAuthUser | undefined;
      const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';

      if (!user) {
        log.error('No user found after GitHub auth');
        res.redirect(`${frontendURL}/login?error=auth_failed`);
        return;
      }

      log.info('GitHub OAuth successful', { email: sanitizeEmail(user.email) });

      const accessToken = generateAccessToken({
        userId: user.uid,
        email: user.email,
        role: user.role || 'student',
      });
      const refreshToken = generateRefreshToken({
        userId: user.uid,
        email: user.email,
        role: user.role || 'student',
      });

      const returnUrl = validateReturnUrl(req.query.state as string, frontendURL);
      setOAuthCookies(res, accessToken, refreshToken, frontendURL);
      
      const redirectUrl = generateOAuthRedirectUrl(user, accessToken, refreshToken, returnUrl, 'github');
      
      log.info('Redirecting user to frontend', { provider: 'github' });
      res.redirect(redirectUrl);
    } catch (error) {
      log.error('GitHub callback error', { error: getErrorMessage(error) });
      const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';
      res.redirect(`${frontendURL}/login?error=auth_callback_failed`);
    }
  }
];

// ============================================
// User & Token Management
// ============================================

/**
 * Get current user data
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    log.info('Get current user request', { userId });

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const user = await userService.getUserById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    log.info('User data retrieved', { email: sanitizeEmail(user.email) });

    res.status(200).json({
      success: true,
      data: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        emailVerified: user.emailVerified,
        photoURL: user.photoURL,
      },
    });
  } catch (error) {
    log.error('Get user error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to get user data. Please try again.',
      error: getErrorMessage(error),
    });
  }
};

/**
 * Refresh access token
 */
export const refreshTokenHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: providedRefreshToken } = req.body;

    log.info('Token refresh request');

    if (!providedRefreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
      return;
    }

    const decoded = verifyToken(providedRefreshToken);

    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    });

    log.info('Access token refreshed', { email: sanitizeEmail(decoded.email) });

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken
      },
    });
  } catch (error) {
    log.error('Token refresh error', { error: getErrorMessage(error) });
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
      error: getErrorMessage(error),
    });
  }
};

/**
 * Logout user (clear cookies)
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';
    
    let cookieDomain: string | undefined = undefined;
    if (isProduction && frontendURL) {
      try {
        const hostname = new URL(frontendURL).hostname;
        cookieDomain = hostname.startsWith('www.') ? hostname.replace(/^www/, '') : `.${hostname}`;
      } catch { /* ignore */ }
    }

    const clearCookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      domain: cookieDomain,
    };

    res.clearCookie('aurikrex_token', clearCookieOptions);
    res.clearCookie('aurikrex_refresh_token', clearCookieOptions);

    log.info('User logged out successfully');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    log.error('Logout error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to logout',
      error: getErrorMessage(error),
    });
  }
};
