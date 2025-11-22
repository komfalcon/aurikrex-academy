# Authentication Flow Testing Guide

This guide provides step-by-step instructions for testing the authentication flows after the fixes have been applied.

## Prerequisites

### Required Environment Variables

#### Backend (Render - `aurikrex-backend.onrender.com`)
```bash
# Server Configuration
PORT=5000
NODE_ENV=production
HOST=0.0.0.0
ALLOWED_ORIGINS=https://aurikrex.tech,https://www.aurikrex.tech

# MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/aurikrex-academy?retryWrites=true&w=majority
MONGO_DB_NAME=aurikrex-academy

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# Email Service (Brevo SMTP)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=9c3c83001@smtp-brevo.com
SMTP_PASSWORD=Xas9m5rdDc8ZSAGh
EMAIL_FROM=info@aurikrex.tech

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://aurikrex-backend.onrender.com/api/auth/google/callback

# URLs
BACKEND_URL=https://aurikrex-backend.onrender.com
FRONTEND_URL=https://aurikrex.tech
```

#### Frontend (Vercel - `aurikrex.tech`)
```bash
# Backend API URL
VITE_API_URL=https://aurikrex-backend.onrender.com/api

# Frontend URL
VITE_FRONTEND_URL=https://aurikrex.tech
```

#### Google Cloud Console Setup
1. Go to https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID
3. Add Authorized redirect URIs:
   - `https://aurikrex-backend.onrender.com/api/auth/google/callback`
4. Add Authorized JavaScript origins:
   - `https://aurikrex.tech`
   - `https://aurikrex-backend.onrender.com`

#### Brevo Email Setup
1. Verify sender email `info@aurikrex.tech` in Brevo dashboard
2. Ensure DNS records (SPF, DKIM) are configured for `aurikrex.tech`
3. Use the SMTP credentials provided above

## Testing Scenarios

### Test 1: Google OAuth Sign-In Flow

#### Expected Behavior
1. User clicks "Sign in with Google" on login or signup page
2. User is redirected to Google's OAuth consent screen
3. After authorizing, user is redirected to backend callback URL
4. Backend sets httpOnly cookies and redirects to frontend `/auth/callback`
5. Frontend stores tokens and user data, then redirects to `/dashboard`

#### Manual Testing Steps
1. Navigate to `https://aurikrex.tech/login`
2. Click "Sign in with Google" button
3. Select a Google account or sign in
4. Grant permissions to the app
5. **Verify**: User is redirected to `https://aurikrex.tech/dashboard`
6. **Verify**: User sees personalized welcome message
7. **Verify**: Browser devtools shows JWT stored in localStorage
8. **Verify**: No errors in browser console

#### Expected Logs (Backend)
```
🔐 Google OAuth callback for: user@example.com
✅ Existing user found: user@example.com (or ✨ Creating new user)
✅ Google OAuth successful for: user@example.com
🔄 Redirecting to: https://aurikrex.tech/auth/callback
```

#### What to Check if It Fails
- [ ] Google OAuth credentials in Render environment
- [ ] Authorized redirect URI matches exactly in Google Cloud Console
- [ ] BACKEND_URL and FRONTEND_URL environment variables are set
- [ ] CORS allows `https://aurikrex.tech` origin
- [ ] Check Render logs for errors: `OAuth2Strategy requires a clientID option`

### Test 2: Email Signup → OTP Verification Flow

#### Expected Behavior
1. User fills signup form with email and password
2. Backend creates user, generates OTP, sends email
3. Backend returns success with redirect to `/verify-email`
4. Frontend navigates to verify-email page
5. User receives OTP email within 1-2 minutes
6. User enters 6-digit OTP
7. Backend verifies OTP, marks user as verified
8. Backend returns success with redirect to `/dashboard`
9. Frontend navigates to dashboard

#### Manual Testing Steps
1. Navigate to `https://aurikrex.tech/signup`
2. Fill in:
   - First Name: Test
   - Last Name: User
   - Email: your-test-email@example.com
   - Password: TestPass123!@#
   - Confirm Password: TestPass123!@#
3. Click "Sign Up"
4. **Verify**: User is redirected to `https://aurikrex.tech/verify-email`
5. **Verify**: Success toast appears: "Account created! Check your email..."
6. **Verify**: Email field shows the correct email address
7. Check your email inbox (and spam folder)
8. **Verify**: OTP email arrives with subject "Verify Your Email - Aurikrex Academy"
9. Enter the 6-digit OTP code
10. **Verify**: User is redirected to `https://aurikrex.tech/dashboard`
11. **Verify**: Success toast appears: "Email verified successfully! 🎉"
12. **Verify**: User sees personalized welcome message

#### Expected Logs (Backend - Signup)
```
🔐 Signup request received for: your-test-email@example.com
✅ User registered successfully: your-test-email@example.com
✅ Verification OTP sent to: your-test-email@example.com
```

#### Expected Logs (Backend - Verification)
```
🔐 OTP verification request for: your-test-email@example.com
✅ OTP verified for: your-test-email@example.com
✅ Email verified for user: your-test-email@example.com
```

#### What to Check if It Fails
- [ ] SMTP credentials are correct in Render environment
- [ ] `info@aurikrex.tech` is verified in Brevo
- [ ] DNS records (SPF, DKIM) are configured
- [ ] Check Render logs for SMTP errors
- [ ] Verify MongoDB connection is working
- [ ] OTP hasn't expired (10-minute TTL)

### Test 3: Email Login Flow

#### Expected Behavior
1. User enters verified email and password
2. Backend authenticates user
3. Backend returns JWT tokens with redirect to `/dashboard`
4. Frontend stores tokens and navigates to dashboard

#### Manual Testing Steps
1. Use an already verified account (from Test 2)
2. Navigate to `https://aurikrex.tech/login`
3. Enter email and password
4. Click "Login"
5. **Verify**: User is redirected to `https://aurikrex.tech/dashboard`
6. **Verify**: Success toast appears: "Welcome back, [FirstName]! 👋"
7. **Verify**: Dashboard shows user information

#### Expected Logs (Backend)
```
🔐 Login request received for: your-test-email@example.com
✅ User logged in successfully: your-test-email@example.com
```

#### What to Check if It Fails
- [ ] Verify email was verified (Test 2 completed successfully)
- [ ] Password is correct
- [ ] MongoDB connection is working
- [ ] JWT_SECRET is set correctly

### Test 4: Unverified User Login Attempt

#### Expected Behavior
1. User with unverified email tries to log in
2. Backend rejects login
3. Frontend shows error and redirects to verify-email page

#### Manual Testing Steps
1. Create a new account but don't verify it
2. Try to log in with those credentials
3. **Verify**: Error message appears
4. **Verify**: User is redirected to `/verify-email` after 2 seconds

### Test 5: OTP Resend Functionality

#### Expected Behavior
1. User is on verify-email page
2. User clicks "Resend Code"
3. New OTP is generated and sent
4. 60-second cooldown prevents spam

#### Manual Testing Steps
1. Be on the verify-email page (from Test 2)
2. Click "Resend Code"
3. **Verify**: Success toast appears
4. **Verify**: "Resend Code" button is disabled for 60 seconds
5. **Verify**: New email arrives with different OTP

### Test 6: Error Handling - Invalid OTP

#### Expected Behavior
1. User enters wrong OTP
2. Backend rejects OTP
3. Frontend shows error, clears OTP field

#### Manual Testing Steps
1. Be on verify-email page
2. Enter a random 6-digit code (e.g., "999999")
3. **Verify**: Error toast appears: "Invalid or expired verification code"
4. **Verify**: OTP field is cleared

### Test 7: Error Handling - Expired OTP

#### Expected Behavior
1. User waits >10 minutes after signup
2. User tries to verify with original OTP
3. Backend rejects expired OTP

#### Manual Testing Steps
1. Create account and receive OTP
2. Wait 11 minutes
3. Try to verify with original OTP
4. **Verify**: Error message about expired code
5. **Verify**: User can request new code

### Test 8: Google OAuth Error Handling

#### Expected Behavior
1. User cancels Google OAuth flow
2. Frontend shows appropriate error message
3. User remains on login page

#### Manual Testing Steps
1. Click "Sign in with Google"
2. Close the Google popup or click "Cancel"
3. **Verify**: Error toast appears
4. **Verify**: User stays on login page

## Security Checks

### Cookie Configuration
1. Open browser DevTools → Application → Cookies
2. After Google OAuth login, verify cookies:
   - `aurikrex_token` should be:
     - HttpOnly: ✓
     - Secure: ✓
     - SameSite: Lax
     - Domain: .aurikrex.tech (production)
   - `aurikrex_refresh_token` should have same properties

### Token Validation
1. Copy JWT token from localStorage
2. Go to https://jwt.io
3. Paste token and verify:
   - Contains userId, email, role
   - Expiry time is correct (1 hour for access token)
   - Algorithm is HS256

### CORS Verification
1. Open DevTools → Network tab
2. Trigger any API call (login, signup)
3. Check response headers:
   - `Access-Control-Allow-Origin` should include `https://aurikrex.tech`
   - `Access-Control-Allow-Credentials` should be `true`

### ReturnUrl Validation
Test that malicious returnUrl is rejected:
1. Modify Google OAuth URL to include bad returnUrl:
   ```
   state=eyJyZXR1cm5VcmwiOiJodHRwczovL2V2aWwuY29tIn0=
   ```
2. Complete OAuth flow
3. **Verify**: User is redirected to `https://aurikrex.tech` (not evil.com)

## Smoke Tests (Quick Verification)

Run these after deployment to verify system is working:

```bash
# 1. Health Check
curl https://aurikrex-backend.onrender.com/health

# 2. Google OAuth URL Generation
curl https://aurikrex-backend.onrender.com/api/auth/google/url

# Expected: { success: true, data: { url: "https://accounts.google.com/..." } }
```

## Common Issues and Solutions

### Issue: "OAuth2Strategy requires a clientID option"
**Solution**: 
- Verify GOOGLE_CLIENT_ID is set in Render environment
- Restart Render service after setting env vars

### Issue: User stuck at backend callback URL
**Solution**:
- Verify FRONTEND_URL is set correctly
- Check backend logs for redirect URL
- Ensure browser allows redirects

### Issue: OTP email not received
**Solution**:
- Check spam folder
- Verify Brevo credentials are correct
- Verify sender email is verified in Brevo
- Check DNS records (SPF, DKIM)
- Check Render logs for SMTP errors

### Issue: CORS errors in browser
**Solution**:
- Verify ALLOWED_ORIGINS includes `https://aurikrex.tech`
- Restart Render service after updating env vars

### Issue: MongoDB connection errors
**Solution**:
- Verify MONGO_URI is correct
- Check MongoDB Atlas whitelist includes Render IPs
- Verify MongoDB cluster is running

## Success Criteria

All tests pass when:
- ✅ Google OAuth redirects to frontend dashboard
- ✅ Email signup sends OTP and redirects to verify-email
- ✅ OTP verification redirects to dashboard
- ✅ Login redirects to dashboard
- ✅ No console errors in browser
- ✅ No 4xx/5xx errors in backend logs
- ✅ Cookies are set correctly (HttpOnly, Secure, SameSite)
- ✅ All redirects use production URLs (no localhost)

## Monitoring and Logs

### Render Logs
```bash
# View recent logs
Visit: https://dashboard.render.com/web/[your-service-id]/logs

# Look for these successful patterns:
✅ Google OAuth successful for: [email]
✅ User registered successfully: [email]
✅ Verification OTP sent to: [email]
✅ OTP verified for: [email]
✅ User logged in successfully: [email]

# Alert on these error patterns:
❌ Google OAuth error:
❌ Signup error:
❌ OTP verification error:
❌ Login error:
```

### Vercel Logs
```bash
# View deployment logs
Visit: https://vercel.com/[your-username]/[project]/deployments

# Check for build errors or runtime errors
```

## Rollback Plan

If issues persist after deployment:
1. Revert to previous commit: `git revert HEAD`
2. Push to trigger redeployment: `git push`
3. Verify previous version works
4. Debug issues locally before redeploying

## Next Steps After Testing

Once all tests pass:
1. ✅ Mark all checklist items complete
2. ✅ Update PR description with test results
3. ✅ Add screenshots/videos of successful flows
4. ✅ Document any additional environment variables needed
5. ✅ Merge PR to main branch
