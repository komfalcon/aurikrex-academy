# Firebase Authentication Production Deployment Checklist

Use this checklist to ensure authentication works correctly on all deployed environments.

## Pre-Deployment Checklist

### 1. Firebase Console Configuration

#### Authentication Settings
- [ ] Navigate to Firebase Console → Authentication → Sign-in method
- [ ] Google provider is **Enabled**
- [ ] Under **Authorized domains**, verify these domains are added:
  - [ ] `localhost` (for local development)
  - [ ] `aurikrex-academy12.web.app`
  - [ ] `aurikrex-academy12.firebaseapp.com`
  - [ ] `aurikrex.tech` (custom domain)
- [ ] Email/Password provider is **Enabled**

#### Google Cloud Console OAuth Configuration
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Select your project (linked to Firebase)
- [ ] Navigate to APIs & Services → Credentials
- [ ] Edit OAuth 2.0 Client ID
- [ ] **Authorized JavaScript origins** includes:
  - [ ] `http://localhost:5173`
  - [ ] `https://aurikrex-academy12.web.app`
  - [ ] `https://aurikrex-academy12.firebaseapp.com`
  - [ ] `https://aurikrex.tech`
- [ ] **Authorized redirect URIs** includes:
  - [ ] `http://localhost:5173/__/auth/handler`
  - [ ] `https://aurikrex-academy12.web.app/__/auth/handler`
  - [ ] `https://aurikrex-academy12.firebaseapp.com/__/auth/handler`
  - [ ] `https://aurikrex.tech/__/auth/handler`
- [ ] Click **Save**
- [ ] Wait 5-10 minutes for changes to propagate

### 2. Environment Variables

#### Frontend (.env in aurikrex-frontend/)
- [ ] `VITE_FIREBASE_API_KEY` is set
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` = `aurikrex-academy1.firebaseapp.com`
- [ ] `VITE_FIREBASE_PROJECT_ID` = `aurikrex-academy1`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` is set
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` is set
- [ ] `VITE_FIREBASE_APP_ID` is set
- [ ] For production: `VITE_API_URL=/api` (recommended) or full Cloud Function URL

#### Backend (Cloud Functions)
- [ ] Local `.env` file exists in `functions/` for development
- [ ] Production config set via Firebase CLI:
  ```bash
  firebase functions:config:set \
    app.allowed_origins="https://aurikrex-academy12.web.app,https://aurikrex-academy12.firebaseapp.com,https://aurikrex.tech"
  ```
- [ ] Email configuration is set (if using email/password auth with OTP)

### 3. Code Configuration

#### firebase.json
- [ ] Contains API rewrite rule:
  ```json
  {
    "source": "/api/**",
    "function": "api"
  }
  ```
- [ ] SPA fallback rewrite is present
- [ ] Headers are configured for caching

#### functions/src/index.ts
- [ ] CORS allowed origins includes all production domains
- [ ] Production mode correctly identifies environment
- [ ] Email service configured (if using OTP)

---

## Build & Deploy Steps

### Step 1: Build Frontend
```bash
cd aurikrex-frontend

# Ensure production .env is configured
# VITE_API_URL=/api (recommended for multi-domain support)

npm run build
```

**Verify**:
- [ ] `dist/` folder created
- [ ] Check `dist/index.html` exists
- [ ] Check `dist/assets/` contains compiled JS/CSS

### Step 2: Build Cloud Functions
```bash
cd functions
npm run build
```

**Verify**:
- [ ] `lib/` folder created
- [ ] No TypeScript errors
- [ ] `lib/index.js` exists

### Step 3: Deploy to Firebase
```bash
# From repository root
firebase deploy

# Or deploy separately:
# firebase deploy --only functions
# firebase deploy --only hosting
```

**Verify**:
- [ ] Deployment completes without errors
- [ ] Note the deployed URLs
- [ ] Functions show as deployed in Firebase Console

### Step 4: Post-Deployment Verification

**Check Firebase Hosting URLs**:
- [ ] Visit: `https://aurikrex-academy12.web.app`
- [ ] Page loads correctly
- [ ] No console errors

**Check Custom Domain**:
- [ ] Visit: `https://aurikrex.tech`
- [ ] Page loads correctly
- [ ] SSL certificate is valid
- [ ] No console errors

**Check Cloud Functions**:
```bash
# Test health endpoint
curl https://us-central1-aurikrex-academy1.cloudfunctions.net/api/health
```
- [ ] Returns `{"status":"ok",...}`

---

## Authentication Testing

### Test on Firebase Default Domain (`https://aurikrex-academy12.web.app`)

#### Google Sign-In
- [ ] Click "Sign in with Google" button
- [ ] Google popup appears
- [ ] Select Google account
- [ ] Successfully redirected to dashboard
- [ ] User data displays correctly
- [ ] No console errors

#### Email/Password Sign-Up
- [ ] Fill sign-up form with valid data
- [ ] Click "Sign Up"
- [ ] Verification email sent
- [ ] OTP code received in email
- [ ] Enter OTP code
- [ ] Email verified successfully
- [ ] No console errors

#### Email/Password Login
- [ ] Use verified account credentials
- [ ] Click "Login"
- [ ] Successfully logged in
- [ ] Redirected to dashboard
- [ ] User data displays correctly
- [ ] No console errors

### Test on Custom Domain (`https://aurikrex.tech`)

Repeat all tests above on the custom domain:

#### Google Sign-In
- [ ] Google Sign-In works
- [ ] User redirected to dashboard
- [ ] No errors

#### Email/Password Sign-Up
- [ ] Sign-up works
- [ ] OTP sent and verified
- [ ] No errors

#### Email/Password Login
- [ ] Login works
- [ ] Dashboard accessible
- [ ] No errors

### Cross-Domain Testing

#### Sign in on one domain, access on another
- [ ] Sign in on `aurikrex-academy12.web.app`
- [ ] Open `aurikrex.tech`
- [ ] Note: User may need to sign in again (different domains, different cookies)
- [ ] Both domains work independently

---

## Troubleshooting Checklist

### If Google Sign-In Fails

- [ ] Check browser console for specific error code
- [ ] Verify all domains are authorized in Firebase Console
- [ ] Verify OAuth redirect URIs in Google Cloud Console
- [ ] Clear browser cache and cookies
- [ ] Try in incognito mode
- [ ] Wait 10 minutes after making OAuth changes
- [ ] Check if popup was blocked by browser
- [ ] Test with different browser

### If Email/Password Fails with "Network Error"

- [ ] Verify `VITE_API_URL` is correct
- [ ] Test API endpoint directly:
  ```bash
  curl https://us-central1-aurikrex-academy1.cloudfunctions.net/api/health
  ```
- [ ] Check Cloud Functions logs:
  ```bash
  firebase functions:log --only api
  ```
- [ ] Verify CORS settings in `functions/src/index.ts`
- [ ] Check firebase.json has API rewrite
- [ ] Verify Cloud Functions are deployed
- [ ] Check browser network tab for actual error

### If OTP Email Not Received

- [ ] Check spam/junk folder
- [ ] Verify email config in Cloud Functions:
  ```bash
  firebase functions:config:get
  ```
- [ ] Check Cloud Functions logs for email errors
- [ ] Verify email credentials are correct
- [ ] Test with different email provider

---

## Monitoring

### After Deployment

- [ ] Monitor Firebase Console → Functions → Logs
- [ ] Check for errors in real-time
- [ ] Monitor authentication events in Firebase Console → Authentication → Users
- [ ] Set up alerting for function errors (optional)

### Regular Checks

- [ ] Weekly: Review authentication logs
- [ ] Monthly: Check for deprecated dependencies
- [ ] Quarterly: Rotate secrets (email password, JWT secret)
- [ ] As needed: Update OAuth credentials if domains change

---

## Rollback Plan

If deployment fails or authentication breaks:

### Option 1: Rollback Hosting Only
```bash
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

### Option 2: Rollback Functions Only
```bash
# Deploy previous version from git
git checkout <previous-commit>
cd functions
npm run build
firebase deploy --only functions
```

### Option 3: Full Rollback
```bash
# Checkout previous stable version
git checkout <previous-stable-commit>
# Rebuild and redeploy
cd aurikrex-frontend && npm run build
cd ../functions && npm run build
cd .. && firebase deploy
```

---

## Success Criteria

Deployment is successful when:

- [ ] All items in this checklist are completed
- [ ] Google Sign-In works on all domains
- [ ] Email/Password authentication works on all domains
- [ ] No console errors on any domain
- [ ] Cloud Functions respond correctly
- [ ] Email OTP delivery works
- [ ] Dashboard displays user data correctly
- [ ] No errors in Cloud Functions logs

---

## Configuration Summary

### Domains
- Local: `http://localhost:5173`
- Firebase Default: `https://aurikrex-academy12.web.app`
- Firebase App: `https://aurikrex-academy12.firebaseapp.com`
- Custom Domain: `https://aurikrex.tech`

### API Endpoints
- Local: `http://localhost:5001/aurikrex-academy1/us-central1/api`
- Production: `https://us-central1-aurikrex-academy1.cloudfunctions.net/api`
- Via Rewrite (all domains): `/api`

### Key Files
- `firebase.json` - Hosting and rewrite configuration
- `aurikrex-frontend/.env` - Frontend environment variables
- `functions/.env` - Backend local development environment variables
- `functions/src/index.ts` - CORS and API configuration

---

**Remember**: 
- Always test in incognito mode to avoid cached credentials
- Wait 5-10 minutes after OAuth configuration changes
- Monitor logs during and after deployment
- Keep this checklist updated with any new domains or requirements

**Last Updated**: November 2024  
**Version**: 1.0
