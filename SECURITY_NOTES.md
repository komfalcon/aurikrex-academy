# Security Notes - Authentication Implementation

## Overview
This document outlines the security considerations and potential improvements for the authentication system.

## Current Implementation

### Token Storage Strategy
The current implementation uses a **dual storage approach**:

1. **HttpOnly Cookies** (Primary - Secure)
   - JWT tokens stored in httpOnly cookies
   - Not accessible to JavaScript (XSS protection)
   - Automatically sent with requests
   - Secure flag enabled in production
   - SameSite=Lax for CSRF protection

2. **URL Parameters & localStorage** (Fallback - Less Secure)
   - Tokens passed in URL during OAuth callback
   - Frontend stores tokens in localStorage
   - Required for backwards compatibility
   - Creates security vulnerabilities:
     - Tokens visible in browser history
     - Tokens visible in server logs
     - Tokens can be cached by proxies
     - Vulnerable to XSS attacks

### Why Dual Storage?
The dual storage approach exists for backwards compatibility while transitioning to cookie-based authentication. The frontend currently relies on localStorage for token management.

## Security Vulnerabilities

### 1. Tokens in URL Parameters (Medium Risk)
**Issue**: Tokens are passed as query parameters during OAuth callback
```
https://aurikrex.tech/auth/callback?token=eyJ...&refreshToken=eyJ...
```

**Risks**:
- Visible in browser history
- Logged by web servers and proxies
- Can be leaked via Referer header
- Stored in browser cache

**Mitigation** (Current):
- Tokens are also in httpOnly cookies
- Logs strip query parameters when possible
- Tokens have short expiry (1 hour for access tokens)

**Recommended Fix** (Future):
Remove tokens from URL entirely and rely solely on cookies:
```typescript
// Instead of
const redirectUrl = `${returnUrl}/auth/callback?token=${token}&...`;

// Use
const redirectUrl = `${returnUrl}/auth/callback?success=true`;
```

### 2. localStorage Token Storage (High Risk)
**Issue**: Frontend stores tokens in localStorage
```typescript
localStorage.setItem('aurikrex-token', token);
```

**Risks**:
- Accessible to any JavaScript code (XSS vulnerability)
- No automatic expiry
- Not protected by CSRF tokens
- Can be stolen by malicious scripts

**Mitigation** (Current):
- Strong Content Security Policy (if implemented)
- Token expiry enforced server-side
- HttpOnly cookies as backup

**Recommended Fix** (Future):
Migrate to cookie-only authentication:
```typescript
// Remove localStorage token storage
// Use cookies exclusively with httpOnly flag
```

## Implemented Security Measures

### ✅ 1. HttpOnly Cookies
```typescript
const cookieOptions = {
  httpOnly: true,        // JavaScript cannot access
  secure: true,          // HTTPS only in production
  sameSite: 'lax',       // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000
};
res.cookie('aurikrex_token', accessToken, cookieOptions);
```

### ✅ 2. Hostname Validation
```typescript
// Prevents subdomain attacks like https://aurikrex.tech.evil.com
const returnUrlObj = new URL(stateData.returnUrl);
const isAllowed = allowedOrigins.some(origin => {
  const allowedUrlObj = new URL(origin);
  return returnUrlObj.hostname === allowedUrlObj.hostname;
});
```

### ✅ 3. Origin Deduplication
```typescript
// Prevents duplicate origins in whitelist
const allowedOrigins = [...new Set([frontendURL, ...allowedOriginsEnv.split(',')])];
```

### ✅ 4. Error Handling
```typescript
// Graceful degradation if URL parsing fails
try {
  const hostname = new URL(frontendURL).hostname;
  cookieDomain = hostname.startsWith('www.') ? hostname.replace(/^www/, '') : `.${hostname}`;
} catch (urlError) {
  console.warn('Failed to parse FRONTEND_URL');
  cookieDomain = undefined;
}
```

### ✅ 5. Sanitized Logging
```typescript
// Strips query parameters from logs
const redirectUrlObj = new URL(redirectUrl);
console.log('Redirecting user to:', `${redirectUrlObj.origin}${redirectUrlObj.pathname}`);
```

## Recommended Future Improvements

### High Priority

#### 1. Remove Tokens from URL
**Timeline**: Next major version
**Implementation**:
```typescript
// Backend: Remove token parameters
const redirectUrl = `${returnUrl}/auth/callback?success=true&email=${email}&uid=${uid}`;

// Frontend: Use cookies API or fetch from backend
const getUserFromCookie = async () => {
  const response = await fetch('/api/auth/me', { credentials: 'include' });
  return response.json();
};
```

#### 2. Migrate Frontend to Cookie-Based Auth
**Timeline**: Next major version
**Implementation**:
- Remove all localStorage token operations
- Use `credentials: 'include'` in fetch calls
- Backend verifies cookie automatically
- Add `/api/auth/me` endpoint to get user info

#### 3. Implement Token Rotation
**Timeline**: Next version
**Implementation**:
```typescript
// On each request, rotate access token if close to expiry
if (tokenExpiresIn < 5 * 60) { // Less than 5 minutes
  const newToken = generateAccessToken(user);
  res.cookie('aurikrex_token', newToken, cookieOptions);
}
```

### Medium Priority

#### 4. Add Content Security Policy
**Timeline**: Next version
**Implementation**:
```typescript
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com"
  );
  next();
});
```

#### 5. Implement Rate Limiting per User
**Timeline**: Next version
**Implementation**:
```typescript
// Current: Global rate limiting
// Future: Per-user rate limiting based on JWT
const userRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user?.userId || req.ip
});
```

#### 6. Add Session Management
**Timeline**: Future
**Implementation**:
- Store active sessions in Redis
- Allow users to view/revoke sessions
- Detect unusual login locations/devices
- Send email notifications for new logins

### Low Priority

#### 7. Add Token Fingerprinting
**Timeline**: Future
**Implementation**:
```typescript
// Include browser fingerprint in token
const fingerprint = hash(userAgent + ipAddress);
// Verify fingerprint on each request
```

#### 8. Implement PKCE for OAuth
**Timeline**: Future
**Implementation**:
```typescript
// Proof Key for Code Exchange (PKCE)
const codeVerifier = generateRandomString(128);
const codeChallenge = base64url(sha256(codeVerifier));
// Include in OAuth flow
```

## Migration Path

### Phase 1: Current State ✅
- Dual storage (cookies + localStorage)
- Tokens in URL for backwards compatibility
- Security warnings documented

### Phase 2: Cookie-First (Recommended Next)
- Add `/api/auth/me` endpoint
- Update frontend to prefer cookies
- Keep URL tokens for backwards compatibility
- Document migration path for users

### Phase 3: Cookie-Only (Future)
- Remove tokens from URL entirely
- Remove localStorage token storage
- Breaking change - requires frontend update
- Improved security posture

### Phase 4: Advanced Features (Optional)
- Token rotation
- Session management
- Token fingerprinting
- PKCE for OAuth

## Testing Security Measures

### Manual Security Tests

#### Test 1: HttpOnly Cookie Verification
```javascript
// In browser console
document.cookie; // Should NOT show aurikrex_token
```

#### Test 2: XSS Token Theft Attempt
```javascript
// Try to steal token (should fail)
localStorage.getItem('aurikrex-token'); // Can see token (vulnerability)
document.cookie; // Cannot see token (secure)
```

#### Test 3: Subdomain Attack Prevention
```bash
# Try to redirect to malicious subdomain
curl -X GET "https://aurikrex-backend.onrender.com/api/auth/google/callback" \
  -H "state: eyJyZXR1cm5VcmwiOiJodHRwczovL2F1cmlrcmV4LnRlY2guZXZpbC5jb20ifQ=="
# Should redirect to legitimate domain only
```

#### Test 4: CSRF Protection
```bash
# Try to make authenticated request from different origin
curl -X POST "https://aurikrex-backend.onrender.com/api/auth/me" \
  -H "Origin: https://evil.com" \
  -H "Cookie: aurikrex_token=..."
# Should be blocked by CORS
```

### Automated Security Scans
```bash
# Run OWASP ZAP scan
zap-cli quick-scan https://aurikrex.tech

# Check for known vulnerabilities
npm audit
npm audit fix

# Run Snyk security scan
npx snyk test
```

## Security Contacts

If you discover a security vulnerability:
1. **DO NOT** open a public issue
2. Email: security@aurikrex.tech (or repository owner)
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)

## Version History

- **v1.0** (2025-11-22): Initial implementation with dual storage
  - HttpOnly cookies added
  - Hostname validation implemented
  - Security notes documented

- **v1.1** (Planned): Cookie-first approach
  - Add `/api/auth/me` endpoint
  - Update frontend to prefer cookies
  - Keep backwards compatibility

- **v2.0** (Future): Cookie-only authentication
  - Remove tokens from URL
  - Remove localStorage storage
  - Breaking change - requires migration
