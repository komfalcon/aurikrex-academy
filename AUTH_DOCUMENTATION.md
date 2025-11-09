# Authentication System Documentation

## Overview

The Aurikrex Academy authentication system provides a secure, user-friendly authentication flow with email verification via OTP (One-Time Password) and Google Sign-In integration.

## Features

### 🔐 Email/Password Authentication
- **Signup**: Users register with first name, last name, email, password, and optional phone
- **Email Verification**: 6-digit OTP sent via email (Titan Mail SMTP)
- **Login**: Only verified users can access the dashboard
- **Password Requirements**:
  - Minimum 10 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 digit
  - At least 1 special character

### 🌐 Google Sign-In
- One-click authentication via Google OAuth
- Automatic email verification (Google accounts are pre-verified)
- No OTP required for Google users

### 📧 Email Verification System
- **OTP Generation**: 6-digit random code
- **Storage**: Firestore with 10-minute expiry
- **Delivery**: Beautifully designed HTML email via Nodemailer
- **Resend**: Users can request a new code after 60 seconds
- **Auto-Submit**: OTP automatically verified when all 6 digits entered

### 🎨 User Experience
- Real-time password validation feedback (red → green)
- Confirm password matching indicator
- Toast notifications for all actions
- Smooth animations with Framer Motion
- Responsive design with TailwindCSS
- Dashboard personalization with user's first name

## Architecture

### Backend (Node.js + TypeScript + Express)
```
aurikrex-backend/
├── src/
│   ├── controllers/
│   │   └── authController.ts       # Auth logic (signup, login, verify, etc.)
│   ├── services/
│   │   ├── AuthService.ts          # Firebase Auth operations
│   │   └── EmailService.ts         # OTP generation & email sending
│   ├── routes/
│   │   └── authRoutes.ts           # Auth endpoints
│   └── config/
│       └── firebase.ts             # Firebase Admin SDK setup
```

### Frontend (React + TypeScript + Vite)
```
aurikrex-frontend/
├── src/
│   ├── pages/
│   │   ├── Signup.tsx              # Registration form
│   │   ├── Login.tsx               # Login form
│   │   ├── VerifyEmail.tsx         # OTP verification
│   │   └── Dashboard.tsx           # Protected dashboard
│   ├── context/
│   │   └── AuthContext.tsx         # Auth state management
│   └── config/
│       └── firebase.ts             # Firebase client SDK
```

## API Endpoints

### POST /api/auth/signup
Register a new user and send OTP email.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890" // optional
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email for verification code.",
  "data": {
    "uid": "firebase-user-id",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### POST /api/auth/verify-otp
Verify the OTP sent to user's email.

**Request:**
```json
{
  "email": "john.doe@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "uid": "firebase-user-id",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "emailVerified": true,
    "token": "custom-firebase-token"
  }
}
```

### POST /api/auth/resend-otp
Resend OTP to user's email.

**Request:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Verification code sent successfully"
}
```

### POST /api/auth/login
Login with email and password (verified users only).

**Request:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "uid": "firebase-user-id",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "John Doe",
    "emailVerified": true,
    "token": "custom-firebase-token"
  }
}
```

**Response (403 - Not Verified):**
```json
{
  "success": false,
  "message": "Account not verified. Please complete email verification to proceed.",
  "emailVerified": false
}
```

### POST /api/auth/google
Sign in with Google ID token.

**Request:**
```json
{
  "idToken": "google-id-token-from-client"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Google sign-in successful",
  "data": {
    "uid": "firebase-user-id",
    "email": "john.doe@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "John Doe",
    "photoURL": "https://...",
    "emailVerified": true
  }
}
```

## Environment Variables

### Backend (.env)
```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Email Configuration (Titan Mail SMTP)
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=info@aurikrex.tech
EMAIL_PASS=your-email-password

# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```bash
# Firebase Client SDK
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Backend API
VITE_API_URL=http://localhost:5000/api
```

## User Flow

### Email/Password Signup
1. User fills signup form (first name, last name, email, password, confirm password)
2. Password validation runs in real-time
3. On submit, backend creates Firebase Auth user and Firestore document
4. OTP generated, stored in Firestore with 10-min expiry
5. Email sent with OTP code
6. User redirected to `/verify-email` page
7. User enters 6-digit OTP (auto-submits when complete)
8. Backend validates OTP, marks user as verified
9. User redirected to dashboard

### Email/Password Login
1. User enters email and password
2. Firebase Auth validates credentials
3. Backend checks email verification status
4. If verified: login successful, redirect to dashboard
5. If not verified: show error, redirect to verification page
6. Dashboard displays personalized welcome: "Welcome back, [FirstName]! 👋"

### Google Sign-In
1. User clicks "Sign in with Google"
2. Google popup appears
3. User selects account
4. ID token sent to backend
5. Backend creates/updates user in Firestore
6. Email automatically verified (Google accounts are trusted)
7. User redirected to dashboard

## Security Features

### Password Security
- Minimum 10 characters
- Complexity requirements enforced
- Passwords hashed by Firebase Auth

### OTP Security
- 6-digit random code
- 10-minute expiry
- One-time use (deleted after verification)
- Stored securely in Firestore

### Authentication Security
- Firebase Admin SDK for server-side validation
- Custom tokens for session management
- Email verification required before login
- CORS protection on backend

### Input Validation
- Server-side validation with express-validator
- Client-side validation for UX
- Email normalization
- SQL injection prevention (Firestore NoSQL)

## Deployment

### Backend Deployment
1. Set environment variables in hosting platform
2. Build: `npm run build`
3. Start: `npm start`
4. Ensure Firestore security rules allow OTP writes/reads
5. Verify email service connection: `emailService.verifyConnection()`

### Frontend Deployment
1. Set environment variables
2. Build: `npm run build`
3. Deploy `dist/` folder to hosting (Firebase Hosting, Vercel, Netlify, etc.)
4. Update CORS_ORIGIN in backend to match production URL

## Troubleshooting

### OTP Not Received
- Check spam/junk folder
- Verify EMAIL_USER and EMAIL_PASS in backend .env
- Test SMTP connection: `emailService.verifyConnection()`
- Check email service logs

### Login Fails with "Account not verified"
- User must complete OTP verification first
- Check `emailVerified` field in Firestore users collection
- Resend OTP if expired

### Google Sign-In Fails
- Verify Firebase project has Google provider enabled
- Check VITE_FIREBASE_API_KEY and other Firebase config
- Ensure popup not blocked by browser
- Check CORS settings

## Future Enhancements

- [ ] Firebase built-in email verification as fallback
- [ ] Password reset flow
- [ ] Two-factor authentication (2FA)
- [ ] Social login (Facebook, Apple)
- [ ] Account recovery
- [ ] Session management & refresh tokens
- [ ] Rate limiting on auth endpoints

## Support

For issues or questions, contact: info@aurikrex.tech
