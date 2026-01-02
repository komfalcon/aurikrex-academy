import { Request, Response } from 'express';
import { userService } from '../services/UserService.mongo.js';
import { emailService } from '../services/EmailService.js';
import { getErrorMessage, AuthError } from '../utils/errors.js';
import passport from '../config/passport.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { log } from '../utils/logger.js';
import { sanitizeEmail } from '../utils/sanitize.js';

interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'student' | 'instructor' | 'admin';
}

interface LoginRequest {
  email: string;
  password: string;
}

interface VerifyOTPRequest {
  email: string;
  otp: string;
}

interface ResendOTPRequest {
  email: string;
}

/**
 * Helper function to parse displayName into firstName and lastName
 */
function parseDisplayName(displayName?: string): { firstName: string; lastName: string } {
  const [firstName, ...lastNameParts] = (displayName || '').split(' ');
  return {
    firstName: firstName || 'User',
    lastName: lastNameParts.join(' ') || '',
  };
}

/**
 * Handle user signup with email/password
 * Sends OTP for verification
 */
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, role }: SignupRequest = req.body;

    log.info('🔐 Signup request received', { email: sanitizeEmail(email) });

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email, password',
      });
      return;
    }

    // Create display name
    const displayName = `${firstName} ${lastName}`;

    // Register user
    const result = await userService.register({
      email,
      password,
      displayName,
      role: (role && ['student', 'instructor', 'admin'].includes(role)) ? role as 'student' | 'instructor' : 'student',
    });

    log.info('✅ User registered successfully', { email: sanitizeEmail(result.user.email) });

    // Send OTP for email verification
    try {
      await emailService.sendVerificationOTP(email, firstName);
      log.info('✅ Verification OTP sent', { email: sanitizeEmail(email) });
    } catch (emailError) {
      log.error('⚠️ Failed to send verification email', { email: sanitizeEmail(email), error: getErrorMessage(emailError) });
      // Don't fail signup if email fails
    }

    const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email for verification code.',
      redirect: `${frontendURL}/verify-email`,
      data: {
        uid: result.user.uid,
        email: result.user.email,
        firstName,
        lastName,
        token: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      },
    });
  } catch (error) {
    log.error('❌ Signup error', { error: getErrorMessage(error) });
    
    // Handle specific error types
    let statusCode = 500;
    let message = 'Failed to create account. Please try again.';
    
    if (error instanceof AuthError) {
      statusCode = error.status;
      message = error.message;
    } else {
      // Check for duplicate key error (MongoDB error code 11000 or known patterns)
      const isDuplicateError = 
        // Check MongoDB error code
        (error as any)?.code === 11000 ||
        // Check for known error patterns in message
        (error instanceof Error && (
          error.message.includes('already in use') ||
          error.message.includes('E11000') ||  // MongoDB duplicate key error pattern
          error.message.toLowerCase().includes('duplicate')
        ));
        
      if (isDuplicateError) {
        statusCode = 409;
        message = 'An account with this email already exists. Please try logging in.';
      }
    }
    
    res.status(statusCode).json({
      success: false,
      message,
      error: getErrorMessage(error),
    });
  }
};

/**
 * Handle user login with email/password
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    log.info('🔐 Login request received', { email: sanitizeEmail(email) });

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Login user
    const result = await userService.login(email, password);

    log.info('✅ User logged in successfully', { email: sanitizeEmail(result.user.email) });

    const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';
    const { firstName, lastName } = parseDisplayName(result.user.displayName);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      redirect: `${frontendURL}/dashboard`,
      data: {
        uid: result.user.uid,
        email: result.user.email,
        firstName,
        lastName,
        displayName: result.user.displayName,
        role: result.user.role,
        emailVerified: result.user.emailVerified,
        photoURL: result.user.photoURL,
        token: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      },
    });
  } catch (error) {
    log.error('❌ Login error', { error: getErrorMessage(error) });
    
    const { email } = req.body as LoginRequest;
    
    // Check for specific error types using error code (preferred) or message (fallback)
    let statusCode = 500;
    let message = 'Failed to login. Please try again.';
    
    // Check if it's an AuthError with a specific code
    if (error instanceof AuthError) {
      statusCode = error.status;
      
      if (error.code === 'auth/email-not-verified') {
        message = 'Email not verified. Please verify your email before logging in.';
        const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';
        
        // Fetch user data to provide firstName for the verification page
        let userData = null;
        try {
          const user = await userService.getUserByEmail(email);
          if (user) {
            const { firstName, lastName } = parseDisplayName(user.displayName);
            userData = {
              email: user.email,
              firstName,
              lastName,
            };
          }
        } catch (userError) {
          log.warn('Could not fetch user data for email verification redirect', { error: getErrorMessage(userError) });
        }
        
        res.status(statusCode).json({
          success: false,
          message,
          emailVerified: false,
          redirect: `${frontendURL}/verify-email`,
          data: userData,
          error: getErrorMessage(error),
        });
        return;
      } else if (error.code === 'auth/invalid-credentials') {
        message = 'Invalid email or password';
      } else if (error.code === 'auth/account-disabled') {
        message = 'Account has been disabled. Please contact support.';
      } else {
        message = error.message;
      }
    } else {
      // Fallback to string-based checking for non-AuthError errors
      const errorMessage = error instanceof Error ? error.message : 'Failed to login';
      if (errorMessage.includes('Invalid') || errorMessage.includes('password')) {
        statusCode = 401;
        message = 'Invalid email or password';
      }
    }
    
    res.status(statusCode).json({
      success: false,
      message,
      error: getErrorMessage(error),
    });
  }
};

/**
 * Verify OTP sent to user's email
 */
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp }: VerifyOTPRequest = req.body;

    log.info('🔐 OTP verification request', { email: sanitizeEmail(email) });

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
      return;
    }

    // Verify OTP
    const isValid = await emailService.verifyOTP(email, otp);

    if (!isValid) {
      log.warn('⚠️ Invalid OTP', { email: sanitizeEmail(email) });
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code',
      });
      return;
    }

    log.info('✅ OTP verified', { email: sanitizeEmail(email) });

    // Get user and update verification status
    const user = await userService.getUserByEmail(email);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Update email verification status
    await userService.updateUser(user.uid, { emailVerified: true } as any);
    log.info('✅ Email verified for user', { email: sanitizeEmail(email) });

    // Generate JWT tokens for the verified user
    const accessToken = generateAccessToken({
      userId: user.uid,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: user.uid,
      email: user.email,
      role: user.role,
    });

    // Get updated user data
    const updatedUser = await userService.getUserByEmail(email);
    const { firstName, lastName } = parseDisplayName(updatedUser?.displayName);

    const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      redirect: `${frontendURL}/dashboard`,
      data: {
        uid: user.uid,
        email: user.email,
        firstName,
        lastName,
        displayName: updatedUser?.displayName,
        emailVerified: true,
        token: accessToken,
        refreshToken: refreshToken,
      },
    });
  } catch (error) {
    log.error('❌ OTP verification error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to verify code. Please try again.',
      error: getErrorMessage(error),
    });
  }
};

/**
 * Helper function to send OTP to user's email
 */
async function sendOTPToUser(email: string, actionName: string): Promise<{
  success: boolean;
  statusCode: number;
  message: string;
  error?: string;
}> {
  try {
    log.info(`🔐 ${actionName} OTP request`, { email: sanitizeEmail(email) });

    // Get user data
    const user = await userService.getUserByEmail(email);
    
    if (!user) {
      return {
        success: false,
        statusCode: 404,
        message: 'User not found. Please sign up first.',
      };
    }

    // Check if already verified
    if (user.emailVerified) {
      return {
        success: false,
        statusCode: 400,
        message: 'Email is already verified',
      };
    }

    // Send new OTP
    const firstName = user.displayName?.split(' ')[0] || 'User';
    await emailService.sendVerificationOTP(email, firstName);

    log.info(`✅ Verification OTP ${actionName.toLowerCase()}`, { email: sanitizeEmail(email) });

    return {
      success: true,
      statusCode: 200,
      message: 'Verification code sent successfully',
    };
  } catch (error) {
    log.error(`❌ ${actionName} OTP error`, { error: getErrorMessage(error) });
    return {
      success: false,
      statusCode: 500,
      message: 'Failed to send verification code. Please try again.',
      error: getErrorMessage(error),
    };
  }
}

/**
 * Send OTP to user's email (for standalone OTP sending)
 */
export const sendOTP = async (req: Request, res: Response): Promise<void> => {
  const { email }: ResendOTPRequest = req.body;

  if (!email) {
    res.status(400).json({
      success: false,
      message: 'Email is required',
    });
    return;
  }

  const result = await sendOTPToUser(email, 'Send');
  res.status(result.statusCode).json({
    success: result.success,
    message: result.message,
    ...(result.error && { error: result.error }),
  });
};

/**
 * Resend OTP to user's email (alias for sendOTP for backwards compatibility)
 */
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  const { email }: ResendOTPRequest = req.body;

  if (!email) {
    res.status(400).json({
      success: false,
      message: 'Email is required',
    });
    return;
  }

  const result = await sendOTPToUser(email, 'Resend');
  res.status(result.statusCode).json({
    success: result.success,
    message: result.message,
    ...(result.error && { error: result.error }),
  });
};

/**
 * Get current user data
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // User is attached to request by auth middleware
    const userId = req.user?.userId;

    log.info('🔍 Get current user request', { userId });

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

    log.info('✅ User data retrieved', { email: sanitizeEmail(user.email) });

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
    log.error('❌ Get user error', { error: getErrorMessage(error) });
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
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    log.info('🔄 Token refresh request');

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
      return;
    }

    // Verify and decode refresh token
    const { verifyToken, generateAccessToken } = await import('../utils/jwt');
    const decoded = verifyToken(refreshToken);

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    });

    log.info('✅ Access token refreshed', { email: sanitizeEmail(decoded.email) });

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken
      },
    });
  } catch (error) {
    log.error('❌ Token refresh error', { error: getErrorMessage(error) });
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
      error: getErrorMessage(error),
    });
  }
};

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

    // Generate Google OAuth URL
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

    log.info('🔐 Google OAuth URL generated');

    res.status(200).json({
      success: true,
      data: {
        url: googleAuthUrl,
      },
    });
  } catch (error) {
    log.error('❌ Google OAuth init error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to initialize Google authentication',
      error: getErrorMessage(error),
    });
  }
};

/**
 * Handle Google OAuth callback
 * This is called by Google after user authorizes
 */
export const googleAuthCallback = [
  passport.authenticate('google', { session: false }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Type assertion with better typing
      interface OAuthUser {
        userId: string;
        email: string;
        role: 'student' | 'instructor' | 'admin';
        uid: string;
        displayName?: string;
      }
      
      const user = req.user as OAuthUser | undefined;

      if (!user) {
        log.error('❌ No user found after Google auth');
        const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';
        res.redirect(`${frontendURL}/login?error=auth_failed`);
        return;
      }

      log.info('✅ Google OAuth successful', { email: sanitizeEmail(user.email) });

      // Generate JWT tokens
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

      // Get frontend URL from state or environment
      const state = req.query.state as string;
      let frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';
      let returnUrl = frontendURL;
      
      if (state) {
        try {
          const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
          if (stateData.returnUrl) {
            // Validate returnUrl - only allow same origin or whitelisted domains
            // Get allowed origins from environment or use defaults
            const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || 'https://aurikrex.tech,https://www.aurikrex.tech';
            // Use Set to deduplicate origins
            const allowedOrigins = [...new Set([frontendURL, ...allowedOriginsEnv.split(',').map(o => o.trim())])];
            
            // Use URL parsing to validate hostname (prevents subdomain attacks)
            try {
              const returnUrlObj = new URL(stateData.returnUrl);
              const isAllowed = allowedOrigins.some(origin => {
                const allowedUrlObj = new URL(origin);
                return returnUrlObj.hostname === allowedUrlObj.hostname;
              });
              if (isAllowed) {
                returnUrl = stateData.returnUrl;
              } else {
                log.warn('🚫 Rejected returnUrl with invalid hostname', { hostname: returnUrlObj.hostname });
              }
            } catch (urlError) {
              log.warn('Failed to parse returnUrl', { error: getErrorMessage(urlError) });
            }
          }
        } catch (e) {
          log.warn('Failed to parse state', { error: getErrorMessage(e) });
        }
      }

      // Set secure httpOnly cookies for tokens
      const isProduction = process.env.NODE_ENV === 'production';
      // Extract domain from FRONTEND_URL for cookie domain setting
      let cookieDomain: string | undefined = undefined;
      if (isProduction && frontendURL) {
        try {
          const hostname = new URL(frontendURL).hostname;
          // For www subdomain, set to parent domain with leading dot
          // For other domains, set with leading dot to allow all subdomains
          cookieDomain = hostname.startsWith('www.') ? hostname.replace(/^www/, '') : `.${hostname}`;
        } catch (urlError) {
          log.warn('Failed to parse FRONTEND_URL for cookie domain', { error: getErrorMessage(urlError) });
          // Fallback to no domain restriction
          cookieDomain = undefined;
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

      // Redirect to frontend with user info only (tokens are in httpOnly cookies)
      // For backwards compatibility with client-side storage, include tokens
      // TODO: Remove token parameters once frontend fully migrates to cookie-based auth
      const redirectUrl = `${returnUrl}/auth/callback?` +
        `token=${encodeURIComponent(accessToken)}` +
        `&refreshToken=${encodeURIComponent(refreshToken)}` +
        `&email=${encodeURIComponent(user.email)}` +
        `&displayName=${encodeURIComponent(user.displayName || '')}` +
        `&uid=${encodeURIComponent(user.uid)}`;

      // Log redirect with sanitized information (avoid exposing tokens)
      try {
        const redirectUrlObj = new URL(redirectUrl);
        log.info('🔄 Redirecting user', { destination: `${redirectUrlObj.origin}${redirectUrlObj.pathname}` });
      } catch {
        log.info('🔄 Redirecting user to frontend');
      }
      res.redirect(redirectUrl);
    } catch (error) {
      log.error('❌ Google callback error', { error: getErrorMessage(error) });
      const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';
      res.redirect(`${frontendURL}/login?error=auth_callback_failed`);
    }
  }
];
