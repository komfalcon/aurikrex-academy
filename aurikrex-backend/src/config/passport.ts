import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { config } from 'dotenv';
import { userService } from '../services/UserService.mongo.js';
import { getErrorMessage } from '../utils/errors.js';

config();

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || 'https://aurikrex-backend.onrender.com'}/api/auth/google/callback`,
    },
    async (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
      try {
        console.log('🔐 Google OAuth callback for:', profile.emails?.[0]?.value);

        // Extract user information from Google profile
        const email = profile.emails?.[0]?.value;
        const displayName = profile.displayName || '';
        const photoURL = profile.photos?.[0]?.value || '';

        if (!email) {
          return done(new Error('No email found in Google profile'), undefined);
        }

        // Check if user exists
        let user = await userService.getUserByEmail(email);

        if (user) {
          // Update existing user's Google info if needed
          console.log('✅ Existing user found:', email);
          
          // Update photo if not set
          if (!user.photoURL && photoURL) {
            await userService.updateUser(user.uid, { photoURL } as any);
            user = await userService.getUserByEmail(email);
          }
        } else {
          // Create new user from Google profile
          console.log('✨ Creating new user from Google profile:', email);
          
          const result = await userService.register({
            email,
            password: '', // Google users don't have passwords
            displayName,
            role: 'student',
          });

          user = result.user;

          // Update additional fields
          await userService.updateUser(user.uid, {
            photoURL,
            emailVerified: true, // Google emails are already verified
          } as any);

          user = await userService.getUserByEmail(email);
        }

        // Ensure email is verified for Google users
        if (user && !user.emailVerified) {
          await userService.updateUser(user.uid, { emailVerified: true } as any);
          user = await userService.getUserByEmail(email);
        }

        console.log('✅ Google OAuth successful for:', email);
        // Return a TokenPayload-compatible object for Express.User
        const userPayload = user ? {
          userId: user.uid,
          email: user.email,
          role: user.role,
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        } : false;
        return done(null, userPayload);
      } catch (error) {
        console.error('❌ Google OAuth error:', getErrorMessage(error));
        return done(error as Error, undefined);
      }
    }
  )
);

// Serialize user to store in session (for session-based auth)
passport.serializeUser((user: any, done) => {
  done(null, user.userId || user.uid);
});

// Deserialize user from session
passport.deserializeUser(async (userId: string, done) => {
  try {
    const user = await userService.getUserById(userId);
    if (user) {
      const userPayload = {
        userId: user.uid,
        email: user.email,
        role: user.role,
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
      };
      done(null, userPayload);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error, null);
  }
});

export default passport;
