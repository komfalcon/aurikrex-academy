# Firebase Authentication Deployment Guide

## Overview

This guide provides step-by-step instructions to fix authentication issues on Firebase Hosting and custom domains. Follow these steps to ensure both **Google Sign-In** and **Email/Password Authentication** work across all environments.

## Deployment Environments

The application is deployed on:
1. **Local Development**: `http://localhost:5173`
2. **Firebase Hosting (Default)**: `https://aurikrex-academy12.web.app` and `https://aurikrex-academy12.firebaseapp.com`
3. **Custom Domain**: `https://aurikrex.tech`

## Common Issues & Solutions

### Issue 1: "Failed to sign in with Google. Please try again"

**Root Cause**: OAuth redirect URIs and authorized domains are not properly configured in Firebase Console.

**Solution**: Configure Google Sign-In provider in Firebase Console.

### Issue 2: "Network error. Please check your connection and try again"

**Root Cause**: Frontend is using incorrect API URL or CORS is blocking requests.

**Solution**: Configure correct production API URL and ensure CORS is properly set up.

---

## Step-by-Step Configuration

### Part 1: Firebase Console Configuration

#### 1. Configure Google Sign-In Provider

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `aurikrex-academy1`
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Ensure it's **Enabled**
6. Under **Authorized domains**, add all your deployment domains:
   - `localhost` (already added by default)
   - `aurikrex-academy12.web.app`
   - `aurikrex-academy12.firebaseapp.com`
   - `aurikrex.tech`
   - Any other custom domains you use

7. **Important**: Click **Save** after adding domains

#### 2. Configure OAuth 2.0 Client (Google Cloud Console)

Google Sign-In also requires OAuth configuration in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (should be linked to Firebase project)
3. Navigate to **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID** (usually auto-created by Firebase)
5. Click to edit it
6. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (for local development)
   - `https://aurikrex-academy12.web.app`
   - `https://aurikrex-academy12.firebaseapp.com`
   - `https://aurikrex.tech`

7. Under **Authorized redirect URIs**, add:
   - `http://localhost:5173/__/auth/handler`
   - `https://aurikrex-academy12.web.app/__/auth/handler`
   - `https://aurikrex-academy12.firebaseapp.com/__/auth/handler`
   - `https://aurikrex.tech/__/auth/handler`

8. Click **Save**

**Note**: Changes may take 5-10 minutes to propagate.

### Part 2: Environment Configuration

#### 1. Frontend Environment Variables

The frontend needs different configurations for different environments.

**For Local Development** (`.env` in `aurikrex-frontend/`):
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
# Use custom domain or Firebase default domain for authDomain
VITE_FIREBASE_AUTH_DOMAIN=aurikrex.tech
VITE_FIREBASE_PROJECT_ID=aurikrex-academy1
VITE_FIREBASE_STORAGE_BUCKET=aurikrex-academy1.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Backend API URL - Local Functions
VITE_API_URL=http://localhost:5001/aurikrex-academy1/us-central1/api
```

**For Production Deployment** (set during build or in CI/CD):

When deploying to Firebase Hosting, the API URL should point to the deployed Cloud Functions:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
# Recommended: Use custom domain for authDomain
VITE_FIREBASE_AUTH_DOMAIN=aurikrex.tech
# Alternative: Use Firebase default domain
# VITE_FIREBASE_AUTH_DOMAIN=aurikrex-academy12.web.app
VITE_FIREBASE_PROJECT_ID=aurikrex-academy1
VITE_FIREBASE_STORAGE_BUCKET=aurikrex-academy1.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Backend API URL - Production Cloud Functions
VITE_API_URL=https://us-central1-aurikrex-academy1.cloudfunctions.net/api
```

**Alternative Production Configuration** (using same origin):

If your `firebase.json` is configured with rewrites (recommended), you can use relative URLs:

```env
# Use same origin - Firebase Hosting will proxy to Cloud Functions
VITE_API_URL=/api
```

This approach is recommended as it works across all domains (web.app, firebaseapp.com, and custom domains).

#### 2. Backend Environment Variables (Cloud Functions)

Configure Cloud Functions environment variables:

**For Local Development** (`.env` in `functions/`):
```env
NODE_ENV=development
FIREBASE_PROJECT_ID=aurikrex-academy1
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@aurikrex-academy1.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://aurikrex-academy1.firebaseio.com
FIREBASE_STORAGE_BUCKET=aurikrex-academy1.appspot.com
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=info@aurikrex.tech
EMAIL_PASS=your-email-password
```

**For Production** (use Firebase Functions config):

```bash
# Set production environment variables
firebase functions:config:set \
  app.allowed_origins="https://aurikrex-academy12.web.app,https://aurikrex-academy12.firebaseapp.com,https://aurikrex.tech" \
  email.host="smtp.titan.email" \
  email.port="465" \
  email.user="info@aurikrex.tech" \
  email.pass="your-email-password"

# View current config
firebase functions:config:get
```

### Part 3: Firebase Hosting Configuration

Ensure your `firebase.json` includes proper rewrites to route API calls to Cloud Functions:

```json
{
  "hosting": {
    "target": "aurikrex",
    "public": "aurikrex-frontend/dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

**Key Points**:
- The `/api/**` rewrite sends all API requests to the `api` Cloud Function
- This allows using relative URLs (`/api`) in the frontend
- Works seamlessly across all domains

---

## Deployment Instructions

### 1. Build Frontend for Production

```bash
cd aurikrex-frontend

# Create production .env (or use CI/CD environment variables)
cat > .env << EOF
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=aurikrex-academy1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=aurikrex-academy1
VITE_FIREBASE_STORAGE_BUCKET=aurikrex-academy1.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_URL=/api
EOF

# Build
npm run build
```

### 2. Build Cloud Functions

```bash
cd functions
npm run build
```

### 3. Deploy to Firebase

From the repository root:

```bash
# Deploy everything (hosting + functions)
firebase deploy

# Or deploy separately
firebase deploy --only functions
firebase deploy --only hosting
```

### 4. Verify Deployment

After deployment:

1. Check the Firebase Hosting URL: `https://aurikrex-academy12.web.app`
2. Check the custom domain: `https://aurikrex.tech`
3. Test Google Sign-In on both domains
4. Test Email/Password Sign-Up and Login on both domains

---

## Testing Checklist

Use this checklist to verify authentication works correctly:

### Local Environment (`http://localhost:5173`)

- [ ] Google Sign-In works
- [ ] Email Sign-Up sends OTP
- [ ] OTP verification works
- [ ] Email Login works (verified users only)
- [ ] Dashboard shows user data correctly

### Firebase Default Domain (`https://aurikrex-academy12.web.app`)

- [ ] Google Sign-In works
- [ ] Email Sign-Up sends OTP
- [ ] OTP verification works
- [ ] Email Login works (verified users only)
- [ ] Dashboard shows user data correctly

### Custom Domain (`https://aurikrex.tech`)

- [ ] Google Sign-In works
- [ ] Email Sign-Up sends OTP
- [ ] OTP verification works
- [ ] Email Login works (verified users only)
- [ ] Dashboard shows user data correctly

---

## Troubleshooting

### Google Sign-In Issues

**Problem**: "Failed to sign in with Google"

**Solutions**:
1. Verify authorized domains in Firebase Console
2. Check OAuth redirect URIs in Google Cloud Console
3. Clear browser cache and cookies
4. Wait 5-10 minutes after making changes to OAuth config
5. Check browser console for specific error codes:
   - `auth/popup-closed-by-user`: User closed popup (not an error)
   - `auth/popup-blocked`: Enable popups in browser
   - `auth/unauthorized-domain`: Domain not authorized in Firebase Console

**Debug Steps**:
```javascript
// Add to AuthContext.tsx temporarily to see detailed errors
catch (error) {
  console.error('Full error object:', error);
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
  throw error;
}
```

### Email/Password Sign-In Issues

**Problem**: "Network error. Please check your connection"

**Solutions**:
1. Verify `VITE_API_URL` is correct for the environment
2. Check Cloud Functions are deployed: `firebase functions:list`
3. Test API directly: `curl https://us-central1-aurikrex-academy1.cloudfunctions.net/api/health`
4. Check CORS settings in Cloud Functions
5. Verify Firebase Hosting rewrites are working

**Debug API Connection**:
```bash
# Test Cloud Function directly
curl https://us-central1-aurikrex-academy1.cloudfunctions.net/api/health

# Should return:
# {"status":"ok","message":"API is running","timestamp":"..."}
```

### Email OTP Not Received

**Problem**: Verification email not arriving

**Solutions**:
1. Check spam/junk folder
2. Verify email credentials in Cloud Functions config:
   ```bash
   firebase functions:config:get
   ```
3. Check Cloud Functions logs:
   ```bash
   firebase functions:log --only api
   ```
4. Test SMTP connection (requires backend access)

### Domain-Specific Issues

**Problem**: Works on one domain but not another

**Solutions**:
1. Ensure all domains are added to Firebase authorized domains
2. Verify `authDomain` in Firebase config matches
3. For custom domains, ensure DNS is properly configured
4. Check SSL certificates are valid
5. Clear browser cache specific to that domain

---

## Environment-Specific Configuration Summary

| Environment | Frontend URL | API URL | authDomain |
|-------------|-------------|---------|------------|
| **Local** | `http://localhost:5173` | `http://localhost:5001/aurikrex-academy1/us-central1/api` or `/api` (with proxy) | `aurikrex.tech` (recommended) or `aurikrex-academy12.web.app` |
| **Firebase Hosting** | `https://aurikrex-academy12.web.app` | `/api` (via rewrite) | `aurikrex.tech` (recommended) or `aurikrex-academy12.web.app` |
| **Custom Domain** | `https://aurikrex.tech` | `/api` (via rewrite) | `aurikrex.tech` (recommended) or `aurikrex-academy12.web.app` |

**Important**: Using `aurikrex.tech` as the `authDomain` is recommended as it provides a consistent authentication experience across all deployment environments. Firebase handles OAuth redirects correctly as long as all domains are authorized in the Firebase Console.

---

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as templates
2. **Use different API keys** for development and production (if possible)
3. **Rotate secrets regularly** - Especially email passwords and JWT secrets
4. **Monitor authentication logs** in Firebase Console
5. **Set up rate limiting** on auth endpoints (already configured)
6. **Enable reCAPTCHA** for production (optional but recommended)

---

## Quick Reference Commands

```bash
# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting

# View function logs
firebase functions:log --only api

# View function config
firebase functions:config:get

# Set function config
firebase functions:config:set key.subkey="value"

# Test deployed API
curl https://us-central1-aurikrex-academy1.cloudfunctions.net/api/health

# Build frontend for production
cd aurikrex-frontend && npm run build

# Build functions
cd functions && npm run build
```

---

## Support

If issues persist after following this guide:

1. Check Firebase Console for errors
2. Review Cloud Functions logs: `firebase functions:log`
3. Verify all configuration steps were completed
4. Clear browser cache and try in incognito mode
5. Test with different browsers
6. Contact support: info@aurikrex.tech

---

**Last Updated**: November 2024  
**Version**: 1.0  
**Status**: Production Ready
