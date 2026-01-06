import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile, VerifyCallback as GoogleVerifyCallback } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
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
const githubCallbackURL = process.env.GITHUB_CALLBACK_URL || `${backendURL}/api/auth/github/callback`;

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

      // Note: Microsoft Graph API does not provide a persistent photo URL
      // We skip storing photos for Microsoft users to avoid large base64 strings in the database
      // Users can update their profile photo through the app settings later

      // Find or create user from OAuth data
      const user = await UserModel.findOrCreateFromOAuth({
        provider: 'microsoft' as OAuthProvider,
        providerUserId,
        email,
        displayName,
        photoURL: undefined, // Microsoft doesn't provide persistent photo URLs
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
// GITHUB OAuth Strategy
// ============================================
// GitHub email interface (GitHub's actual API returns more fields than passport types define)
interface GitHubEmail {
  value: string;
  type?: string;
  primary?: boolean;
  verified?: boolean;
}

/**
 * Safely extract primary email from GitHub profile emails
 * GitHub's API may return emails with primary/verified flags not in passport types
 */
function extractGitHubPrimaryEmail(emails: Array<{ value: string; type?: string }> | undefined): string | undefined {
  if (!emails || emails.length === 0) return undefined;
  
  // Cast to GitHubEmail[] to access potential primary/verified fields
  const typedEmails = emails as GitHubEmail[];
  
  // Priority: primary > verified > first available
  const primaryEmail = typedEmails.find((e) => e.primary === true);
  if (primaryEmail?.value) return primaryEmail.value;
  
  const verifiedEmail = typedEmails.find((e) => e.verified === true);
  if (verifiedEmail?.value) return verifiedEmail.value;
  
  return emails[0]?.value;
}

// Only register GitHub strategy if credentials are configured
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    'github',
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: githubCallbackURL,
        scope: ['user:email', 'read:user'],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: GitHubProfile,
        done: (error: Error | null, user?: unknown) => void
      ) => {
        try {
          // Extract primary email using helper function
          const primaryEmail = extractGitHubPrimaryEmail(profile.emails);
          const providerUserId = profile.id;
          const displayName = profile.displayName || profile.username || '';
          const photoURL = profile.photos?.[0]?.value || '';

          log.info('🔐 GitHub OAuth callback', { 
            email: primaryEmail ? sanitizeEmail(primaryEmail) : 'no-email', 
            providerId: providerUserId,
            username: profile.username 
          });

          if (!primaryEmail) {
            return done(new Error('No email found in GitHub profile. Please ensure your GitHub email is public or add a verified email.'));
          }

          // Find or create user from OAuth data
          const user = await UserModel.findOrCreateFromOAuth({
            provider: 'github' as OAuthProvider,
            providerUserId,
            email: primaryEmail,
            displayName,
            photoURL,
          });

          log.info('✅ GitHub OAuth successful', { email: sanitizeEmail(primaryEmail) });
          return done(null, createUserPayload(user));
        } catch (error) {
          log.error('❌ GitHub OAuth error', { error: getErrorMessage(error) });
          return done(error as Error);
        }
      }
    )
  );
  log.info('✅ GitHub OAuth strategy registered');
} else {
  log.warn('⚠️ GitHub OAuth not configured - GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET missing');
}

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
