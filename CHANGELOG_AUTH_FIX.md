# Changelog - Authentication Flow Fixes

## Summary
Fixed critical authentication flow issues where Google OAuth was leaving users at the backend callback endpoint and email signup wasn't properly directing users to the verification page.

## Date
2025-11-22

## Changes Made

### Backend Changes

#### 1. `aurikrex-backend/src/config/passport.ts`
**Issue**: Google OAuth callback URL was using a relative path as fallback instead of constructing from BACKEND_URL.

**Fix**:
```typescript
// Before
callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'

// After
callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || 'https://aurikrex-backend.onrender.com'}/api/auth/google/callback`
```

**Impact**: Ensures Google OAuth always has a valid callback URL even if GOOGLE_CALLBACK_URL isn't explicitly set.

#### 2. `aurikrex-backend/src/controllers/authController.mongo.ts`

##### a. Google OAuth Callback Handler (`googleAuthCallback`)
**Issues**: 
- Users were redirected to `/auth/callback` but it wasn't clear they should go to the frontend
- No httpOnly cookies for security
- No returnUrl validation

**Fixes**:
1. **Added httpOnly Cookie Support**:
   ```typescript
   const cookieOptions = {
     httpOnly: true,
     secure: isProduction,
     sameSite: 'lax' as const,
     maxAge: 7 * 24 * 60 * 60 * 1000,
     domain: isProduction ? '.aurikrex.tech' : undefined,
   };
   res.cookie('aurikrex_token', accessToken, cookieOptions);
   res.cookie('aurikrex_refresh_token', refreshToken, cookieOptions);
   ```

2. **Added ReturnUrl Validation**:
   ```typescript
   const allowedOrigins = [frontendURL, 'https://aurikrex.tech', 'https://www.aurikrex.tech'];
   if (allowedOrigins.some(origin => stateData.returnUrl.startsWith(origin))) {
     returnUrl = stateData.returnUrl;
   }
   ```

3. **Improved Redirect URL Construction**:
   - Now explicitly redirects to `${returnUrl}/auth/callback` with tokens
   - Logs redirect URL for debugging
   - Handles errors by redirecting to frontend login page

**Impact**: 
- Users are now properly redirected to the frontend dashboard
- Tokens are stored securely in httpOnly cookies
- Prevents open redirect vulnerabilities

##### b. Signup Endpoint (`signup`)
**Issue**: Response didn't include explicit redirect information for the frontend.

**Fix**:
```typescript
const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';

res.status(201).json({
  success: true,
  message: 'Account created successfully. Please check your email for verification code.',
  redirect: `${frontendURL}/verify-email`,  // Added this field
  data: { ... }
});
```

**Impact**: Frontend knows exactly where to navigate after successful signup.

##### c. Login Endpoint (`login`)
**Issue**: Similar to signup, no explicit redirect information.

**Fix**:
```typescript
const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';

res.status(200).json({
  success: true,
  message: 'Login successful',
  redirect: `${frontendURL}/dashboard`,  // Added this field
  data: { ... }
});
```

**Impact**: Frontend can handle redirects consistently.

##### d. Verify OTP Endpoint (`verifyOTP`)
**Issue**: No explicit redirect information after successful verification.

**Fix**:
```typescript
const frontendURL = process.env.FRONTEND_URL || 'https://aurikrex.tech';

res.status(200).json({
  success: true,
  message: 'Email verified successfully',
  redirect: `${frontendURL}/dashboard`,  // Added this field
  data: { ... }
});
```

**Impact**: User is directed to dashboard after email verification.

### Frontend Changes

#### 1. `aurikrex-frontend/src/pages/Signup.tsx`
**Issue**: Frontend was hardcoding navigation to `/verify-email` instead of using backend's redirect instruction.

**Fix**:
```typescript
// Before
navigate('/verify-email', { state: { email, firstName } });

// After
if (data.redirect) {
  const redirectPath = data.redirect.replace(/^https?:\/\/[^/]+/, '');
  navigate(redirectPath, { state: { email, firstName } });
} else {
  navigate('/verify-email', { state: { email, firstName } });
}
```

**Impact**: Frontend respects backend's redirect instruction, making flow more maintainable.

#### 2. `aurikrex-frontend/src/pages/VerifyEmail.tsx`
**Issue**: Hardcoded navigation to `/dashboard` after verification.

**Fixes**:
1. **Use Backend Redirect**:
   ```typescript
   if (data.redirect) {
     const redirectPath = data.redirect.replace(/^https?:\/\/[^/]+/, '');
     setTimeout(() => navigate(redirectPath), 1000);
   } else {
     setTimeout(() => navigate('/dashboard'), 1000);
   }
   ```

2. **Store Refresh Token**:
   ```typescript
   if (data.data.refreshToken) {
     localStorage.setItem('aurikrex-refresh-token', data.data.refreshToken);
   }
   ```

**Impact**: Consistent redirect handling and proper token storage.

#### 3. `aurikrex-frontend/src/pages/Login.tsx`
**Issue**: Similar to other pages, hardcoded navigation.

**Fixes**:
1. **Use Backend Redirect**:
   ```typescript
   if (data.redirect) {
     const redirectPath = data.redirect.replace(/^https?:\/\/[^/]+/, '');
     navigate(redirectPath);
   } else {
     navigate('/dashboard');
   }
   ```

2. **Store Refresh Token**:
   ```typescript
   if (data.data.refreshToken) {
     localStorage.setItem('aurikrex-refresh-token', data.data.refreshToken);
   }
   ```

**Impact**: Consistent redirect handling across all auth flows.

## Security Improvements

1. **HttpOnly Cookies**: JWT tokens are now stored in httpOnly cookies (in addition to localStorage), making them inaccessible to JavaScript and protecting against XSS attacks.

2. **ReturnUrl Validation**: Only whitelisted domains are allowed as return URLs, preventing open redirect vulnerabilities.

3. **Secure Cookie Settings**:
   - `httpOnly: true` - Prevents JavaScript access
   - `secure: true` - Only sent over HTTPS in production
   - `sameSite: 'lax'` - CSRF protection
   - `domain: '.aurikrex.tech'` - Allows cookies across subdomains

## Testing Requirements

Before considering this fix complete, the following must be tested:

1. **Google OAuth Flow**:
   - [ ] User clicks "Sign in with Google"
   - [ ] Google consent screen appears
   - [ ] After authorization, user lands on `https://aurikrex.tech/dashboard`
   - [ ] No errors in console
   - [ ] Tokens stored in both cookies and localStorage

2. **Email Signup Flow**:
   - [ ] User fills signup form
   - [ ] User is redirected to `/verify-email` page
   - [ ] OTP email is received
   - [ ] After entering OTP, user lands on `/dashboard`

3. **Email Login Flow**:
   - [ ] User enters credentials
   - [ ] User is redirected to `/dashboard`
   - [ ] Tokens are stored correctly

4. **Error Handling**:
   - [ ] Invalid OTP shows error
   - [ ] Cancelled Google OAuth shows error
   - [ ] All errors redirect properly

## Environment Variables Required

These environment variables MUST be set for the fixes to work:

### Backend (Render)
```bash
BACKEND_URL=https://aurikrex-backend.onrender.com
FRONTEND_URL=https://aurikrex.tech
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_CALLBACK_URL=https://aurikrex-backend.onrender.com/api/auth/google/callback
```

### Frontend (Vercel)
```bash
VITE_API_URL=https://aurikrex-backend.onrender.com/api
VITE_FRONTEND_URL=https://aurikrex.tech
```

### Google Cloud Console
- Authorized redirect URI: `https://aurikrex-backend.onrender.com/api/auth/google/callback`
- Authorized JavaScript origins: `https://aurikrex.tech`

## Migration Notes

### For Existing Users
No database migration required. Existing users can continue to use the system without any changes.

### For Developers
1. Pull latest changes
2. Verify environment variables are set
3. Rebuild backend: `npm run build`
4. Rebuild frontend: `npm run build`
5. Run tests (see AUTH_FLOW_TESTING.md)

## Breaking Changes
None. This is a bug fix that maintains backward compatibility.

## Known Issues / Limitations
1. Tokens are stored in both cookies and localStorage for compatibility. Future versions could migrate to cookie-only storage.
2. Cookie domain is set to `.aurikrex.tech` which requires the domain to be exactly `aurikrex.tech` or a subdomain. This won't work for localhost development (which is intentional for security).

## Rollback Plan
If issues arise:
```bash
git revert HEAD
git push
```

This will revert to the previous version. The auth system will still work, but users may experience the original issues (stuck at callback URL, etc.).

## Related Documentation
- See `AUTH_FLOW_TESTING.md` for comprehensive testing guide
- See `ENV_VARS_CHECKLIST.md` for environment variable setup
- See `.env.example` files for configuration templates

## Contributors
- GitHub Copilot Agent (implementation)
- komfalcon (review and deployment)
