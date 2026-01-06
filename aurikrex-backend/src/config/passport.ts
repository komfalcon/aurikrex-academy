import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile, VerifyCallback as GoogleVerifyCallback } from 'passport-google-oauth20';
import OAuth2Strategy from 'passport-oauth2';
import { config } from 'dotenv';
import { UserModel, OAuthProvider } from '../models/User.model.js';
import { getErrorMessage } from '../utils/errors.js';
import { log } from '../utils/logger.js';
import { sanitizeEmail } from '../utils/sanitize.js';

config();

// Get the callback URLs from environment
const backendURL = process.env.BACKEND_URL || 'http://localhost:5000';
const googleCallbackURL = process.env.GOOGLE_CALLBACK_URL || `${backendURL}/api/auth/google/callback`;
const microsoftCallbackURL = process.env.MICROSOFT_CALLBACK_URL || `${backendURL}/api/auth/microsoft/callback`;

/**
 * Helper function to create user payload for JWT tokens
 */
function createUserPayload(user: any) {
  return {
    userId: user._id?.toString() || user.uid,
    email: user.email,
    role: user.role,
    uid: user._id?.toString() || user.uid,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    provider: user.provider,
  };
}

// ============================================
// GOOGLE OAuth Strategy
// ============================================
passport.use(
  'google',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: googleCallbackURL,
    },
    async (_accessToken: string, _refreshToken: string, profile: GoogleProfile, done: GoogleVerifyCallback) => {
      try {
        const email = profile.emails?.[0]?.value;
        const providerUserId = profile.id;
        const displayName = profile.displayName || '';
        const photoURL = profile.photos?.[0]?.value || '';

        log.info('🔐 Google OAuth callback', { email: email ? sanitizeEmail(email) : 'no-email', providerId: providerUserId });

        if (!email) {
          return done(new Error('No email found in Google profile'), undefined);
        }

        // Find or create user from OAuth data
        const user = await UserModel.findOrCreateFromOAuth({
          provider: 'google' as OAuthProvider,
          providerUserId,
          email,
          displayName,
          photoURL,
        });

        log.info('✅ Google OAuth successful', { email: sanitizeEmail(email) });
        return done(null, createUserPayload(user));
      } catch (error) {
        log.error('❌ Google OAuth error', { error: getErrorMessage(error) });
        return done(error as Error, undefined);
      }
    }
  )
);

// ============================================
// MICROSOFT OAuth Strategy (Azure AD / Microsoft Identity)
// ============================================
const microsoftTenantId = process.env.MICROSOFT_TENANT_ID || 'common';

// Microsoft OAuth2 using passport-oauth2
const MicrosoftStrategy = new OAuth2Strategy(
  {
    authorizationURL: `https://login.microsoftonline.com/${microsoftTenantId}/oauth2/v2.0/authorize`,
    tokenURL: `https://login.microsoftonline.com/${microsoftTenantId}/oauth2/v2.0/token`,
    clientID: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    callbackURL: microsoftCallbackURL,
    scope: ['openid', 'profile', 'email', 'User.Read'],
  },
  async (accessToken: string, _refreshToken: string, _params: any, _profile: any, done: (error: any, user?: any) => void) => {
    try {
      // Fetch user profile from Microsoft Graph API
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Microsoft Graph API error: ${response.status}`);
      }

      const microsoftProfile = await response.json() as {
        mail?: string;
        userPrincipalName?: string;
        id: string;
        displayName?: string;
      };
      
      const email = microsoftProfile.mail || microsoftProfile.userPrincipalName;
      const providerUserId = microsoftProfile.id;
      const displayName = microsoftProfile.displayName || '';

      log.info('🔐 Microsoft OAuth callback', { email: email ? sanitizeEmail(email) : 'no-email', providerId: providerUserId });

      if (!email) {
        return done(new Error('No email found in Microsoft profile'));
      }

      // Try to get profile photo from Microsoft Graph API
      let photoURL: string | undefined;
      try {
        const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (photoResponse.ok) {
          const photoBuffer = await photoResponse.arrayBuffer();
          const base64Photo = Buffer.from(photoBuffer).toString('base64');
          const contentType = photoResponse.headers.get('content-type') || 'image/jpeg';
          photoURL = `data:${contentType};base64,${base64Photo}`;
        }
      } catch (photoError) {
        log.warn('Could not fetch Microsoft profile photo', { error: getErrorMessage(photoError) });
      }

      // Find or create user from OAuth data
      const user = await UserModel.findOrCreateFromOAuth({
        provider: 'microsoft' as OAuthProvider,
        providerUserId,
        email,
        displayName,
        photoURL,
      });

      log.info('✅ Microsoft OAuth successful', { email: sanitizeEmail(email) });
      return done(null, createUserPayload(user));
    } catch (error) {
      log.error('❌ Microsoft OAuth error', { error: getErrorMessage(error) });
      return done(error as Error);
    }
  }
);

passport.use('microsoft', MicrosoftStrategy);

// ============================================
// GITHUB OAuth Strategy (placeholder - no env vars yet)
// ============================================
// GitHub OAuth will be added later when environment variables are available
// The frontend will show the button but backend routes won't work until configured

// ============================================
// Serialization for session-based auth
// ============================================
passport.serializeUser((user: any, done) => {
  done(null, user.userId || user.uid);
});

passport.deserializeUser(async (userId: string, done) => {
  try {
    const user = await UserModel.findById(userId);
    if (user) {
      done(null, createUserPayload(user));
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error, null);
  }
});

export default passport;
