import { Request, Response } from 'express';
import { userService } from '../services/UserService.mongo.js';
import { emailService } from '../services/EmailService.js';
import { getErrorMessage } from '../utils/errors.js';

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
 * Handle user signup with email/password
 * Sends OTP for verification
 */
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, role }: SignupRequest = req.body;

    console.log('🔐 Signup request received for:', email);

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
      role: (role && ['student', 'instructor'].includes(role)) ? role : 'student',
    });

    console.log('✅ User registered successfully:', result.user.email);

    // Send OTP for email verification
    try {
      await emailService.sendVerificationOTP(email, firstName);
      console.log('✅ Verification OTP sent to:', email);
    } catch (emailError) {
      console.error('⚠️ Failed to send verification email:', getErrorMessage(emailError));
      // Don't fail signup if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email for verification code.',
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
    console.error('❌ Signup error:', getErrorMessage(error));
    res.status(500).json({
      success: false,
      message: 'Failed to create account. Please try again.',
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

    console.log('🔐 Login request received for:', email);

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Login user
    const result = await userService.login(email, password);

    console.log('✅ User logged in successfully:', result.user.email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        role: result.user.role,
        emailVerified: result.user.emailVerified,
        token: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', getErrorMessage(error));
    const errorMessage = error instanceof Error ? error.message : 'Failed to login';
    const statusCode = errorMessage.includes('Invalid') || errorMessage.includes('password') ? 401 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: statusCode === 401 ? 'Invalid email or password' : 'Failed to login. Please try again.',
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

    console.log('🔐 OTP verification request for:', email);

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
      console.warn('⚠️ Invalid OTP for:', email);
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code',
      });
      return;
    }

    console.log('✅ OTP verified for:', email);

    // Get user and update verification status
    const user = await userService.getUserByEmail(email);
    
    if (user) {
      await userService.updateUser(user.uid, { emailVerified: true } as any);
      console.log('✅ Email verified for user:', email);
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error('❌ OTP verification error:', getErrorMessage(error));
    res.status(500).json({
      success: false,
      message: 'Failed to verify code. Please try again.',
      error: getErrorMessage(error),
    });
  }
};

/**
 * Resend OTP to user's email
 */
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email }: ResendOTPRequest = req.body;

    console.log('🔐 Resend OTP request for:', email);

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
    }

    // Get user data
    const user = await userService.getUserByEmail(email);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if already verified
    if (user.emailVerified) {
      res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
      return;
    }

    // Send new OTP
    const firstName = user.displayName?.split(' ')[0] || 'User';
    await emailService.sendVerificationOTP(email, firstName);

    console.log('✅ Verification OTP resent to:', email);

    res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
    });
  } catch (error) {
    console.error('❌ Resend OTP error:', getErrorMessage(error));
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification code. Please try again.',
      error: getErrorMessage(error),
    });
  }
};

/**
 * Get current user data
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // User is attached to request by auth middleware
    const userId = req.user?.userId;

    console.log('🔍 Get current user request for:', userId);

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

    console.log('✅ User data retrieved:', user.email);

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
    console.error('❌ Get user error:', getErrorMessage(error));
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

    console.log('🔄 Token refresh request');

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

    console.log('✅ Access token refreshed for:', decoded.email);

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken
      },
    });
  } catch (error) {
    console.error('❌ Token refresh error:', getErrorMessage(error));
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
      error: getErrorMessage(error),
    });
  }
};
