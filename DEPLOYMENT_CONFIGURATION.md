# Deployment Configuration Guide

Complete configuration checklist for deploying Aurikrex Academy to production.

## Backend Deployment (Render)

### Required Environment Variables

Set these in your Render dashboard under Environment tab:

```bash
# Server Configuration
PORT=5000
NODE_ENV=production
HOST=0.0.0.0

# CORS - Add your frontend domains
ALLOWED_ORIGINS=https://aurikrex.tech,https://www.aurikrex.tech

# MongoDB Atlas
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/aurikrex-academy?retryWrites=true&w=majority
MONGO_DB_NAME=aurikrex-academy

# AI Services
OPENAI_API_KEY=sk-your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
CLAUDE_API_KEY=sk-ant-your-claude-api-key  # Optional

# Security - Generate a secure 32+ character random string
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# Email Service (Titan Mail)
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=info@aurikrex.tech
EMAIL_PASS=your-email-password

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://aurikrex-backend.onrender.com/api/auth/google/callback
FRONTEND_URL=https://aurikrex.tech

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=logs/server.log

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100
```

### Build & Start Commands

In Render dashboard:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: Node 20

### Health Check

Configure health check in Render:
- **Health Check Path**: `/health`
- **Expected Status Code**: 200

## Frontend Deployment (Vercel)

### Required Environment Variables

Set these in Vercel dashboard under Settings > Environment Variables:

```bash
# Backend API URL - Use your Render backend URL
VITE_API_URL=https://aurikrex-backend.onrender.com/api

# Frontend URL
VITE_FRONTEND_URL=https://aurikrex.tech

# App Configuration
VITE_APP_NAME=AurikrexAcademy
```

### Build Settings

In Vercel dashboard:
- **Framework Preset**: Vite
- **Root Directory**: `aurikrex-frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node Version**: 20.x

### Domain Configuration

1. Add custom domain in Vercel:
   - Primary: `aurikrex.tech`
   - Alias: `www.aurikrex.tech`

2. Configure DNS (in your domain registrar):
   ```
   Type: A
   Name: @
   Value: 76.76.21.21  # Vercel IP

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. Enable HTTPS/SSL (automatic in Vercel)

## MongoDB Atlas Configuration

### IP Whitelist

Add these IPs to MongoDB Atlas Network Access:
1. **Render Backend**: Add your Render service IP (or allow 0.0.0.0/0 for all)
2. **Development**: Add your local IP for testing

To find Render IP:
```bash
curl -s https://aurikrex-backend.onrender.com/health | grep -o '"ip":"[^"]*"'
```

### Database User

1. Create a database user in MongoDB Atlas
2. Grant read/write access to `aurikrex-academy` database
3. Use this user in `MONGO_URI`

### Collections

The following collections will be created automatically:
- `users` - User accounts and profiles
- `lessons` - Lesson content and metadata
- `lessonProgress` - User progress tracking
- `analytics` - Usage analytics
- `otpVerifications` - Email verification codes

## Google Cloud Console Configuration

### OAuth 2.0 Client

1. **Authorized JavaScript origins**:
   ```
   https://aurikrex.tech
   https://www.aurikrex.tech
   ```

2. **Authorized redirect URIs**:
   ```
   https://aurikrex-backend.onrender.com/api/auth/google/callback
   ```

### OAuth Consent Screen

- **App name**: Aurikrex Academy
- **Support email**: info@aurikrex.tech
- **Authorized domains**: 
  - `aurikrex.tech`
  - `aurikrex-backend.onrender.com`
- **Scopes**: `email`, `profile`, `openid`

## Email Service Configuration

### Titan Mail SMTP

1. Verify domain ownership in Titan Mail
2. Create email account: `info@aurikrex.tech`
3. Enable SMTP access
4. Get SMTP credentials
5. Configure in backend environment variables

### Test Email Delivery

After deployment, test OTP email:
```bash
curl -X POST https://aurikrex-backend.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "your-test-email@example.com",
    "password": "TestPass123!"
  }'
```

Check if email arrives within 1-2 minutes.

## Security Checklist

### Backend Security

- [x] JWT_SECRET is at least 32 characters, randomly generated
- [x] CORS only allows specific frontend domains
- [x] Rate limiting is enabled (100 req/15min)
- [x] MongoDB connection string uses strong password
- [x] Email credentials are secure
- [x] Google OAuth secrets are not committed to git
- [x] HTTPS only in production
- [x] Environment variables are not logged

### Frontend Security

- [x] API calls use HTTPS in production
- [x] Tokens stored in localStorage (consider httpOnly cookies for enhanced security)
- [x] No sensitive data in client-side code
- [x] XSS protection via React's built-in escaping

### Database Security

- [x] MongoDB IP whitelist configured
- [x] Database user has minimal required permissions
- [x] Connection string uses authentication
- [x] SSL/TLS enabled for connections

## Testing Checklist

### Backend Tests

Test each endpoint:

```bash
# Health check
curl https://aurikrex-backend.onrender.com/health

# Signup (creates user, sends OTP email)
curl -X POST https://aurikrex-backend.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"test@example.com","password":"SecurePass123!"}'

# Verify OTP
curl -X POST https://aurikrex-backend.onrender.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'

# Login
curl -X POST https://aurikrex-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# Get current user (requires token)
curl https://aurikrex-backend.onrender.com/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Frontend Tests

Test each flow:

1. **Email Signup Flow**:
   - Navigate to https://aurikrex.tech/signup
   - Fill form and submit
   - Check email for OTP
   - Verify OTP
   - Should redirect to dashboard

2. **Google OAuth Flow**:
   - Navigate to https://aurikrex.tech/signup
   - Click "Sign up with Google"
   - Authorize with Google
   - Should redirect to dashboard

3. **Login Flow**:
   - Navigate to https://aurikrex.tech/login
   - Enter credentials
   - Should redirect to dashboard

4. **Protected Routes**:
   - Try accessing /dashboard without login
   - Should redirect to /login

## Monitoring & Logging

### Render Logs

Access logs:
1. Go to Render dashboard
2. Select your service
3. Click "Logs" tab
4. Monitor for errors

### MongoDB Atlas Monitoring

1. Go to MongoDB Atlas dashboard
2. Check "Metrics" tab
3. Monitor:
   - Connection count
   - Query performance
   - Storage usage

### Vercel Analytics

1. Go to Vercel dashboard
2. Select your project
3. View analytics for:
   - Page views
   - Performance metrics
   - Error rates

## Troubleshooting

### Backend won't start
1. Check Render logs for errors
2. Verify all environment variables are set
3. Test MongoDB connection string
4. Check if MongoDB IP whitelist includes Render IP

### Frontend can't connect to backend
1. Verify `VITE_API_URL` is correct
2. Check CORS settings in backend
3. Test backend endpoints directly with curl
4. Check browser console for errors

### Google OAuth fails
1. Verify redirect URI matches exactly in Google Console
2. Check that Client ID and Secret are correct
3. Ensure OAuth consent screen is published
4. Test in incognito mode

### Email OTP not received
1. Check email service credentials
2. Verify email domain is configured
3. Check spam folder
4. Test email service connection
5. Check backend logs for email errors

### MongoDB connection timeout
1. Verify IP whitelist includes Render IP (or 0.0.0.0/0)
2. Check MongoDB Atlas status
3. Verify connection string is correct
4. Check network access settings

## Rollback Plan

If deployment fails:

### Backend Rollback
1. Go to Render dashboard
2. Click on service
3. Go to "Events" tab
4. Find previous successful deploy
5. Click "Redeploy"

### Frontend Rollback
1. Go to Vercel dashboard
2. Select project
3. Go to "Deployments" tab
4. Find previous working deployment
5. Click "..." > "Promote to Production"

## Maintenance

### Regular Tasks

- **Weekly**: Check error logs
- **Monthly**: Review MongoDB storage usage
- **Quarterly**: Rotate JWT_SECRET and database passwords
- **As needed**: Update dependencies for security patches

### Backup Strategy

1. **MongoDB**: Enable automated backups in Atlas
2. **Code**: Git repository serves as backup
3. **Environment variables**: Keep secure backup of .env files

## Support Contacts

- **Render Support**: https://render.com/support
- **Vercel Support**: https://vercel.com/support
- **MongoDB Support**: https://www.mongodb.com/support
- **Google Cloud**: https://cloud.google.com/support

## Final Deployment Checklist

Before going live:

- [ ] All environment variables configured
- [ ] MongoDB IP whitelist updated
- [ ] Google OAuth credentials configured
- [ ] Email service tested
- [ ] HTTPS enabled on all endpoints
- [ ] CORS configured correctly
- [ ] Health checks passing
- [ ] All API endpoints tested
- [ ] Signup flow tested
- [ ] Login flow tested
- [ ] Google OAuth tested
- [ ] OTP email delivery tested
- [ ] Dashboard loads correctly
- [ ] Error handling working
- [ ] Logs are accessible
- [ ] Monitoring is active
- [ ] Backup strategy in place
- [ ] Security checklist complete
- [ ] DNS records configured
- [ ] SSL certificates active
