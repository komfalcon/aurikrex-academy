# Firebase to MongoDB Authentication Migration - Complete Documentation

## Overview

This document details all changes made to migrate from Firebase authentication to a MongoDB + Render backend authentication system, preparing the frontend for Vercel deployment.

## Summary of Changes

### Files Removed

#### Firebase Configuration
- `.firebaserc` - Firebase project configuration
- `firebase.json` - Firebase hosting configuration
- `aurikrex-frontend/src/config/firebase.ts` - Firebase SDK initialization
- `aurikrex-backend/src/config/firebase.ts` - Firebase Admin SDK initialization

#### Firebase Functions Directory
- `functions/` - Entire Firebase Cloud Functions directory (60+ files removed)
  - Includes all Firebase-specific services, controllers, routes, middleware, and utilities

#### Firebase-Based Backend Files
- `aurikrex-backend/src/controllers/authController.ts` - Firebase auth controller
- `aurikrex-backend/src/controllers/lessonController.ts` - Firebase lesson controller
- `aurikrex-backend/src/routes/authRoutes.ts` - Firebase auth routes
- `aurikrex-backend/src/routes/lessonRoutes.ts` - Firebase lesson routes
- `aurikrex-backend/src/routes/analyticsRoutes.ts` - Firebase analytics routes
- `aurikrex-backend/src/services/AuthService.ts` - Firebase auth service
- `aurikrex-backend/src/services/UserService.ts` - Firebase user service
- `aurikrex-backend/src/services/LessonService.ts` - Firebase lesson service
- `aurikrex-backend/src/services/StorageService.ts` - Firebase storage service
- `aurikrex-backend/src/services/AnalyticsService.ts` - Firebase analytics service

### Files Modified

#### Frontend

**package.json**
- Removed dependency: `firebase@^12.5.0`

**src/context/AuthContext.tsx**
- Removed Firebase imports: `signInWithPopup`, `User as FirebaseUser`, `auth`, `googleProvider`
- Added JWT token validation on initialization
- Updated `signInWithGoogle()` to call backend API for OAuth URL instead of Firebase popup
- Removed Firebase `auth.signOut()` call from logout function

**src/pages/Login.tsx**
- Removed Firebase imports: `signInWithEmailAndPassword`, `auth as firebaseAuth`
- Updated login flow to call backend API directly instead of Firebase Auth
- Removed Firebase ID token generation and verification
- Removed Firebase-specific error handling
- Simplified to pure backend API authentication

**src/vite-env.d.ts**
- Removed Firebase environment variable types:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`

**.env.example**
- Removed all Firebase configuration variables
- Kept only `VITE_API_URL` for backend communication

#### Backend

**package.json**
- Removed dependency: `firebase-admin@^13.5.0`

**src/types/auth.types.ts**
- Removed Firebase import: `UserRecord from "firebase-admin/auth"`
- Replaced `AuthUser extends Omit<UserRecord, 'toJSON'>` with standalone interface
- Added explicit properties: `uid`, `email`, `displayName`, `photoURL`, `disabled`, `emailVerified`, `role`, `createdAt`, `lastLogin`

**src/services/UserService.mongo.ts**
- Simplified `mapDocumentToAuthUser()` method
- Removed Firebase-specific fields: `customClaims`, `metadata`, `providerData`, `tokensValidAfterTime`
- Returns clean AuthUser interface matching MongoDB schema

### Files Added

**aurikrex-frontend/src/utils/api.ts**
- New API utility module for authenticated requests
- `getToken()` - Retrieves JWT token from localStorage
- `apiRequest()` - Makes authenticated API calls with automatic token attachment
- `validateToken()` - Validates JWT token structure and expiration

**aurikrex-frontend/vercel.json**
- Vercel deployment configuration
- SPA routing configuration (all routes to index.html)
- Asset caching headers for optimization

## Authentication Flow Changes

### Before (Firebase)

1. **Signup**:
   - Frontend: `createUserWithEmailAndPassword()` → Firebase Auth
   - Backend: Store additional data in Firestore
   - Email verification via Firebase

2. **Login**:
   - Frontend: `signInWithEmailAndPassword()` → Firebase Auth
   - Get Firebase ID token
   - Send ID token to backend for verification
   - Backend validates token and returns user data

3. **Google OAuth**:
   - Frontend: `signInWithPopup(auth, googleProvider)` → Firebase
   - Get Firebase ID token
   - Send to backend for profile creation/retrieval

### After (MongoDB + JWT)

1. **Signup**:
   - Frontend: POST `/api/auth/signup` → Backend
   - Backend: Create user in MongoDB, hash password with bcrypt
   - Send OTP via email for verification
   - Return JWT token

2. **Login**:
   - Frontend: POST `/api/auth/login` → Backend
   - Backend: Validate credentials against MongoDB
   - Check email verification status
   - Return JWT token + user data

3. **Email Verification**:
   - Frontend: POST `/api/auth/verify-otp` → Backend
   - Backend: Validate OTP, update user in MongoDB
   - Mark email as verified

4. **Google OAuth** (Backend Implementation Required):
   - Frontend: GET `/api/auth/google/url` → Backend
   - Backend returns OAuth URL
   - User completes OAuth flow
   - Backend callback receives user profile
   - Create/update user in MongoDB
   - Return JWT token

## Environment Variables

### Frontend (Vercel)

Required environment variable:
- `VITE_API_URL` - Backend API URL (e.g., `https://your-app.onrender.com/api`)

### Backend (Render)

Required environment variables:
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRES_IN` - JWT expiration time
- `SMTP_*` - Email service configuration for OTP sending
- `ALLOWED_ORIGINS` - CORS allowed origins
- `NODE_ENV` - Environment (production/development)
- `PORT` - Server port

## Deployment Instructions

### Frontend (Vercel)

1. Connect GitHub repository to Vercel
2. Set framework preset to "Vite"
3. Set root directory to `aurikrex-frontend`
4. Configure environment variable: `VITE_API_URL`
5. Deploy

### Backend (Render)

1. Connect GitHub repository to Render
2. Create Web Service
3. Set root directory to `aurikrex-backend`
4. Set build command: `npm install && npm run build`
5. Set start command: `npm start`
6. Configure all required environment variables
7. Deploy

## Testing Checklist

- [ ] User can sign up with email/password
- [ ] OTP is sent to user's email
- [ ] User can verify email with OTP
- [ ] User can login with verified email
- [ ] User cannot login with unverified email
- [ ] JWT token is stored in localStorage
- [ ] JWT token is attached to API requests
- [ ] Invalid/expired tokens are handled
- [ ] User can logout (token is cleared)
- [ ] Google OAuth flow works (after backend implementation)

## Security Improvements

1. **Password Hashing**: Using bcrypt instead of Firebase Auth
2. **JWT-based Auth**: Stateless authentication with signed tokens
3. **Token Expiration**: Configurable JWT expiration
4. **OTP Verification**: Email verification via time-limited OTP codes
5. **CORS Configuration**: Explicit allowed origins
6. **Rate Limiting**: API rate limiting middleware in place
7. **Input Validation**: Express-validator for request validation

## Known Limitations

1. **Google OAuth**: Backend needs full implementation of OAuth flow
2. **Password Reset**: Feature needs implementation (TODO in Login.tsx)
3. **Refresh Tokens**: May need implementation for long-lived sessions
4. **Email Service**: Requires SMTP configuration in backend

## Migration Benefits

1. **Cost Reduction**: No Firebase costs
2. **Full Control**: Complete control over authentication logic
3. **Flexibility**: Easy to customize and extend
4. **Portability**: Can migrate database/backend easily
5. **Simplicity**: Fewer dependencies, clearer data flow
6. **MongoDB Integration**: Single database for all data

## Files Statistics

- **67 files deleted** (Firebase Functions + config + services)
- **7 files modified** (Frontend auth, backend types)
- **2 files added** (API utility, Vercel config)
- **Total lines removed**: ~8,500+
- **Total lines added**: ~150

## Conclusion

The migration successfully removes all Firebase dependencies and establishes a modern, JWT-based authentication system using MongoDB. The frontend is ready for Vercel deployment, and the backend is ready for Render deployment. All authentication flows go through the custom backend API, providing full control and flexibility.
