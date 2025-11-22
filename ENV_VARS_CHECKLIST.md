# Environment Variables Checklist

This document lists all required environment variables for production deployment.

## Backend (Render)

### ✅ Already Configured (Verify These)
```bash
# Server
PORT=5000
NODE_ENV=production
HOST=0.0.0.0

# URLs - CRITICAL FOR AUTH FLOWS
BACKEND_URL=https://aurikrex-backend.onrender.com
FRONTEND_URL=https://aurikrex.tech
ALLOWED_ORIGINS=https://aurikrex.tech,https://www.aurikrex.tech

# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/aurikrex-academy?retryWrites=true&w=majority
MONGO_DB_NAME=aurikrex-academy

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d
```

### ⚠️ Need to Verify/Update
```bash
# Google OAuth - MUST MATCH Google Cloud Console
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=https://aurikrex-backend.onrender.com/api/auth/google/callback

# Email Service (Brevo) - MUST BE VERIFIED IN BREVO
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=9c3c83001@smtp-brevo.com
SMTP_PASSWORD=Xas9m5rdDc8ZSAGh
EMAIL_FROM=info@aurikrex.tech
```

### Optional (Can Add Later)
```bash
# AI Services
OPENAI_API_KEY=sk-your-key
CLAUDE_API_KEY=sk-ant-your-key
GEMINI_API_KEY=your-key

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=logs/server.log

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

## Frontend (Vercel)

### ✅ Required
```bash
# Backend API - CRITICAL FOR API CALLS
VITE_API_URL=https://aurikrex-backend.onrender.com/api

# Frontend URL - CRITICAL FOR REDIRECTS
VITE_FRONTEND_URL=https://aurikrex.tech
```

### Optional
```bash
VITE_APP_NAME=AurikrexAcademy
```

## External Services Configuration

### Google Cloud Console
**URL**: https://console.cloud.google.com/apis/credentials

1. **OAuth 2.0 Client ID**
   - Authorized redirect URIs:
     - ✅ `https://aurikrex-backend.onrender.com/api/auth/google/callback`
   - Authorized JavaScript origins:
     - ✅ `https://aurikrex.tech`
     - ✅ `https://aurikrex-backend.onrender.com`

2. **Copy Credentials to Render**:
   - Client ID → `GOOGLE_CLIENT_ID`
   - Client Secret → `GOOGLE_CLIENT_SECRET`

### Brevo (Email Service)
**URL**: https://app.brevo.com

1. **SMTP Credentials** (Already in env vars):
   - Login: `9c3c83001@smtp-brevo.com`
   - Password: `Xas9m5rdDc8ZSAGh`

2. **Sender Verification**:
   - ✅ Verify `info@aurikrex.tech` is added and verified
   - ✅ Check sender status in Settings → Senders

3. **DNS Records** (Domain: `aurikrex.tech`):
   Required for email delivery:
   ```
   SPF Record (TXT):
   v=spf1 include:spf.brevo.com ~all
   
   DKIM Record (CNAME):
   mail._domainkey → mail._domainkey.brevo.com
   ```

### MongoDB Atlas
**URL**: https://cloud.mongodb.com

1. **IP Whitelist**:
   - ✅ Add Render service IPs (or allow all: `0.0.0.0/0`)
   - Path: Network Access → IP Access List

2. **Database User**:
   - ✅ Verify user has read/write permissions
   - Path: Database Access

3. **Connection String**:
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/aurikrex-academy?retryWrites=true&w=majority`
   - ✅ Update `MONGO_URI` in Render if changed

## Verification Commands

### Check Backend Environment
```bash
# SSH into Render or use dashboard
echo $BACKEND_URL
echo $FRONTEND_URL
echo $GOOGLE_CLIENT_ID
echo $SMTP_USER
echo $EMAIL_FROM
```

### Check Frontend Environment (Vercel)
```bash
# Via Vercel dashboard
Settings → Environment Variables
- Check VITE_API_URL
- Check VITE_FRONTEND_URL
```

### Test Connectivity
```bash
# Test backend health
curl https://aurikrex-backend.onrender.com/health

# Test Google OAuth URL generation
curl https://aurikrex-backend.onrender.com/api/auth/google/url

# Expected response:
# { "success": true, "data": { "url": "https://accounts.google.com/..." } }
```

## Common Mistakes to Avoid

1. **❌ Using localhost in production**
   - BACKEND_URL and FRONTEND_URL must be production URLs

2. **❌ Mismatched Google OAuth redirect URI**
   - Must match EXACTLY in Google Cloud Console

3. **❌ Unverified sender email in Brevo**
   - EMAIL_FROM must be verified in Brevo dashboard

4. **❌ MongoDB IP whitelist**
   - Render IPs must be whitelisted in MongoDB Atlas

5. **❌ Wrong CORS origins**
   - ALLOWED_ORIGINS must include production frontend URL

6. **❌ Missing environment variables after Render restart**
   - Always verify env vars are set after service restarts

## Deployment Checklist

Before deploying:
- [ ] All backend env vars are set in Render
- [ ] All frontend env vars are set in Vercel
- [ ] Google OAuth redirect URI is configured
- [ ] Brevo sender email is verified
- [ ] MongoDB IP whitelist includes Render
- [ ] DNS records for email are configured
- [ ] Test health endpoint responds
- [ ] Test Google OAuth URL generation
- [ ] No hardcoded localhost URLs in code

After deploying:
- [ ] Run smoke tests (see AUTH_FLOW_TESTING.md)
- [ ] Check Render logs for errors
- [ ] Test Google OAuth flow end-to-end
- [ ] Test email signup → OTP flow
- [ ] Verify cookies are set correctly
- [ ] No CORS errors in browser console

## Troubleshooting

### Error: "OAuth2Strategy requires a clientID option"
**Fix**: Set GOOGLE_CLIENT_ID in Render environment variables and restart service

### Error: CORS policy blocked
**Fix**: Add frontend URL to ALLOWED_ORIGINS in Render

### Error: OTP email not received
**Fix**: 
1. Verify EMAIL_FROM in Brevo
2. Check DNS records
3. Check Render logs for SMTP errors

### Error: "User stuck at backend callback URL"
**Fix**: Verify FRONTEND_URL is set correctly in Render

### Error: MongoDB connection failed
**Fix**: 
1. Check MONGO_URI format
2. Verify IP whitelist in MongoDB Atlas
3. Check database user permissions

## Support

If you need help with environment variables:
1. Check Render logs for specific errors
2. Verify all env vars are set (no typos)
3. Restart Render service after changing env vars
4. Test with curl commands above
5. Review AUTH_FLOW_TESTING.md for detailed tests
