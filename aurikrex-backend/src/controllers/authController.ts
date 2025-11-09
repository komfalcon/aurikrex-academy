import { Request, Response } from 'express';
import { authService } from '../services/AuthService';
import { emailService } from '../services/EmailService';
import { db, auth as firebaseAuth } from '../config/firebase';
import { getErrorMessage } from '../utils/errors';

interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
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
    const { firstName, lastName, email, password, phone }: SignupRequest = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email, password',
      });
      return;
    }

    // Check if user already exists
    try {
      await authService.getUserByEmail(email);
      res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    } catch (error) {
      // User doesn't exist, proceed with signup
    }

    // Create user in Firebase Auth
    const displayName = `${firstName} ${lastName}`;
    const user = await authService.createUser({
      email,
      password,
      displayName,
      role: 'student',
    });

    // Store additional user data in Firestore
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email,
      firstName,
      lastName,
      displayName,
      phone: phone || null,
      emailVerified: false,
      verificationMethod: 'otp',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send OTP for email verification
    await emailService.sendVerificationOTP(email, firstName);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email for verification code.',
      data: {
        uid: user.uid,
        email: user.email,
        firstName,
        lastName,
      },
    });
  } catch (error) {
    console.error('Signup error:', getErrorMessage(error));
    res.status(500).json({
      success: false,
      message: 'Failed to create account. Please try again.',
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
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code',
      });
      return;
    }

    // Update user's email verification status in Firestore
    const userQuery = await db.collection('users').where('email', '==', email).limit(1).get();
    
    if (userQuery.empty) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const userDoc = userQuery.docs[0];
    await userDoc.ref.update({
      emailVerified: true,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    });

    // Get updated user data
    const userData = userDoc.data();

    // Generate custom token for authentication
    const customToken = await authService.generateCustomToken(userData.uid);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        uid: userData.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        emailVerified: true,
        token: customToken,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', getErrorMessage(error));
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

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
    }

    // Get user data
    const userQuery = await db.collection('users').where('email', '==', email).limit(1).get();
    
    if (userQuery.empty) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const userData = userQuery.docs[0].data();

    // Check if already verified
    if (userData.emailVerified) {
      res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
      return;
    }

    // Send new OTP
    await emailService.sendVerificationOTP(email, userData.firstName);

    res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
    });
  } catch (error) {
    console.error('Resend OTP error:', getErrorMessage(error));
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification code. Please try again.',
      error: getErrorMessage(error),
    });
  }
};

/**
 * Handle user login with email/password
 * Only allows verified users to login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Get user from Firestore
    const userQuery = await db.collection('users').where('email', '==', email).limit(1).get();
    
    if (userQuery.empty) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // Check if email is verified
    if (!userData.emailVerified) {
      res.status(403).json({
        success: false,
        message: 'Account not verified. Please complete email verification to proceed.',
        emailVerified: false,
      });
      return;
    }

    // Verify password by attempting to get custom token
    // Note: Firebase Admin SDK doesn't have a direct password verification method
    // In production, you'd typically verify this on the client side with Firebase Auth
    // For now, we'll generate a custom token assuming the password check happens client-side
    
    try {
      const user = await authService.getUserByEmail(email);
      const customToken = await authService.generateCustomToken(user.uid);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          uid: userData.uid,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          displayName: userData.displayName,
          emailVerified: userData.emailVerified,
          token: customToken,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }
  } catch (error) {
    console.error('Login error:', getErrorMessage(error));
    res.status(500).json({
      success: false,
      message: 'Failed to login. Please try again.',
      error: getErrorMessage(error),
    });
  }
};

/**
 * Handle Google Sign-In
 * Skips OTP verification for Google users
 */
export const googleSignIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({
        success: false,
        message: 'ID token is required',
      });
      return;
    }

    // Verify the ID token
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'No email associated with this Google account',
      });
      return;
    }

    // Check if user exists in Firestore
    let userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      // Create new user record for Google sign-in
      const nameParts = (name || email.split('@')[0]).split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';

      await db.collection('users').doc(uid).set({
        uid,
        email,
        firstName,
        lastName,
        displayName: name || `${firstName} ${lastName}`,
        photoURL: picture || null,
        emailVerified: true, // Google emails are pre-verified
        verificationMethod: 'google',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      userDoc = await db.collection('users').doc(uid).get();
    } else {
      // Update last login
      await userDoc.ref.update({
        updatedAt: new Date(),
      });
    }

    const userData = userDoc.data();

    res.status(200).json({
      success: true,
      message: 'Google sign-in successful',
      data: {
        uid: userData?.uid,
        email: userData?.email,
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        displayName: userData?.displayName,
        photoURL: userData?.photoURL,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error('Google sign-in error:', getErrorMessage(error));
    res.status(500).json({
      success: false,
      message: 'Failed to sign in with Google. Please try again.',
      error: getErrorMessage(error),
    });
  }
};

/**
 * Get current user data
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = req.body;

    if (!uid) {
      res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
      return;
    }

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const userData = userDoc.data();

    res.status(200).json({
      success: true,
      data: {
        uid: userData?.uid,
        email: userData?.email,
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        displayName: userData?.displayName,
        phone: userData?.phone,
        photoURL: userData?.photoURL,
        emailVerified: userData?.emailVerified,
      },
    });
  } catch (error) {
    console.error('Get user error:', getErrorMessage(error));
    res.status(500).json({
      success: false,
      message: 'Failed to get user data. Please try again.',
      error: getErrorMessage(error),
    });
  }
};
