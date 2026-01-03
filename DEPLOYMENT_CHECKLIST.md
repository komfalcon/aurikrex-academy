# Deployment Checklist for Aurikrex Academy

**Status**: ✅ Ready for Production Deployment  
**Architecture**: React Frontend (Vercel) + Node.js Backend (Render) + MongoDB (Atlas)  
**Production URLs**: 
- Frontend: https://aurikrex.tech
- Backend: https://aurikrex-backend.onrender.com/api

---

## ✅ Pre-Deployment Status (Already Completed)

The following items have been verified and completed:
- ✅ **Firebase References Removed**: All Firebase imports/configs completely removed
- ✅ **Environment Variables Fixed**: Standardized to VITE_API_URL
- ✅ **MongoDB Connection**: Verified and working with IP whitelist configured
- ✅ **Email Service**: SMTP configured and tested
- ✅ **Frontend Build**: Successfully builds with `npm run build`
- ✅ **Backend Build**: Successfully builds with `npm run build`
- ✅ **Vercel Config**: vercel.json properly configured for SPA routing
- ✅ **Security Audit**: CodeQL scan passed with 0 vulnerabilities

---

## Pre-Deployment Checks

### Backend (Render)

- [ ] MongoDB Atlas IP whitelist is configured
  - Add `0.0.0.0/0` to allow all IPs (for Render dynamic IPs)
  - Or add specific Render IP ranges if known
  
- [ ] Environment variables are set in Render dashboard:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=5000`
  - [ ] `HOST=0.0.0.0` (or leave default)
  - [ ] `ALLOWED_ORIGINS` (comma-separated list including Vercel frontend URL)
  - [ ] `MONGO_URI` (MongoDB Atlas connection string)
  - [ ] `MONGO_DB_NAME=aurikrex-academy`
  - [ ] `OPENAI_API_KEY`
  - [ ] `GEMINI_API_KEY` (optional)
  - [ ] `JWT_SECRET` (minimum 32 characters, cryptographically random)
  - [ ] `ACCESS_TOKEN_EXPIRY=1h`
  - [ ] `REFRESH_TOKEN_EXPIRY=7d`
  - [ ] `EMAIL_HOST` (SMTP server)
  - [ ] `EMAIL_PORT` (465 or 587)
  - [ ] `EMAIL_SECURE` (true for port 465, false for 587)
  - [ ] `EMAIL_USER`
  - [ ] `EMAIL_PASS`
  - [ ] `LOG_LEVEL=info` (production)
  - [ ] `RATE_LIMIT_WINDOW=900000` (optional)
  - [ ] `RATE_LIMIT_MAX=100` (optional)

- [ ] Build command configured: `npm install && npm run build`
- [ ] Start command configured: `npm start`
- [ ] Node version set to 20.x
- [ ] Health check endpoint configured: `/health`

### Frontend (Vercel)

- [ ] Environment variables are set in Vercel dashboard:
  - [ ] `VITE_API_URL` (Production: `https://aurikrex-backend.onrender.com/api`)
  - [ ] `VITE_JWT_SECRET` (Must match backend JWT_SECRET)
  - [ ] `VITE_APP_NAME=AurikrexAcademy`
  - [ ] `VITE_FRONTEND_URL` (Production: `https://aurikrex.tech`)

- [ ] Build settings configured:
  - [ ] Framework Preset: `Vite`
  - [ ] Root Directory: `aurikrex-frontend`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `dist`
  - [ ] Install Command: `npm install`

- [ ] Custom domain configured (optional)
- [ ] SSL certificate verified (automatic with Vercel)

### MongoDB Atlas

- [ ] Database user created with appropriate permissions
- [ ] Network access configured (allow Render IPs or 0.0.0.0/0)
- [ ] Connection string tested and working
- [ ] Indexes created (automatically on first backend startup)
- [ ] Backup strategy configured (Atlas automatic backups)

## Deployment Steps

### 1. Backend Deployment (Render)

1. Push code to GitHub repository
2. Connect GitHub repository to Render
3. Create new Web Service
4. Configure service settings:
   - Name: `aurikrex-backend` (or your choice)
   - Region: Choose closest to your users
   - Branch: `main` (or your deployment branch)
   - Root Directory: `aurikrex-backend`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Add all environment variables
6. Deploy service
7. Wait for deployment to complete
8. Test health endpoint: `https://your-app.onrender.com/health`
9. Note the service URL for frontend configuration

### 2. Frontend Deployment (Vercel)

1. Push code to GitHub repository (if not already)
2. Connect GitHub repository to Vercel
3. Import project and configure:
   - Framework Preset: `Vite`
   - Root Directory: `aurikrex-frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variable:
   - `VITE_API_URL` = Your Render backend URL + `/api`
5. Deploy
6. Wait for deployment to complete
7. Test the application

### 3. Post-Deployment Verification

- [ ] Backend health check returns 200 OK
- [ ] Frontend loads successfully
- [ ] User signup works
- [ ] OTP email is received
- [ ] Email verification works
- [ ] User login works
- [ ] Dashboard loads with user data
- [ ] Lesson generation works
- [ ] Analytics tracking works
- [ ] JWT token refresh works
- [ ] Logout works correctly

## Testing Checklist

### Authentication Flow
- [ ] Navigate to signup page
- [ ] Fill in all required fields with valid data
- [ ] Submit form - should receive success message
- [ ] Check email for OTP
- [ ] Enter OTP on verification page
- [ ] Should redirect to dashboard after successful verification
- [ ] Try login with same credentials
- [ ] Should successfully login and reach dashboard

### Lesson Generation
- [ ] Navigate to lesson generation page
- [ ] Fill in lesson parameters
- [ ] Submit generation request
- [ ] Wait for AI to generate lesson
- [ ] Verify lesson content is displayed
- [ ] Check lesson is saved to database

### Dashboard
- [ ] Verify user profile information displays correctly
- [ ] Check progress statistics are shown
- [ ] Verify recent activity is tracked
- [ ] Test navigation between different sections

### Error Scenarios
- [ ] Try signup with existing email - should show error
- [ ] Try login with wrong password - should show error
- [ ] Try accessing protected route without auth - should redirect to login
- [ ] Try expired JWT token - should prompt for refresh or re-login
- [ ] Try invalid OTP - should show error message

## Security Verification

- [ ] JWT_SECRET is cryptographically random and at least 32 characters
- [ ] All API keys are stored in environment variables (never in code)
- [ ] CORS is configured to only allow your frontend domain
- [ ] Rate limiting is active (test with multiple rapid requests)
- [ ] Password requirements are enforced (min length, complexity)
- [ ] OTP expires after 10 minutes
- [ ] Tokens expire as configured (1h for access, 7d for refresh)
- [ ] HTTPS is enforced on all endpoints
- [ ] MongoDB credentials are not exposed in logs

## Performance Checks

- [ ] Frontend loads in under 3 seconds
- [ ] API responses are under 500ms (excluding AI generation)
- [ ] Images and assets are properly cached
- [ ] Database queries use indexes
- [ ] No memory leaks in backend
- [ ] Frontend bundle size is optimized

## Monitoring Setup

### Render
- [ ] Enable logging
- [ ] Set up alerts for service downtime
- [ ] Configure metrics tracking
- [ ] Set up automatic restarts on failure

### Vercel
- [ ] Enable analytics
- [ ] Set up error tracking
- [ ] Configure deployment notifications
- [ ] Review build performance

### MongoDB Atlas
- [ ] Set up performance alerts
- [ ] Configure backup notifications
- [ ] Enable query profiling (temporarily, for optimization)
- [ ] Set up disk space alerts

## Rollback Plan

If issues are found after deployment:

### Backend (Render)
1. Navigate to Render dashboard
2. Go to your service
3. Click on "Rollback" button
4. Select previous working deployment
5. Confirm rollback

### Frontend (Vercel)
1. Navigate to Vercel dashboard
2. Go to your project
3. Find previous working deployment
4. Click "Promote to Production"

### Database
- MongoDB Atlas provides point-in-time recovery
- Contact Atlas support if needed for recovery

## Common Issues and Solutions

### Backend won't start
- Check Render logs for error messages
- Verify all environment variables are set correctly
- Test MongoDB connection from Render IP
- Check if MongoDB Atlas network access allows Render IPs

### Frontend can't connect to backend
- Verify VITE_API_URL is correct and includes `/api`
- Check CORS settings in backend
- Verify backend is actually running (test health endpoint)
- Check browser console for specific error messages

### OTP emails not sending
- Verify SMTP credentials are correct
- Check email service logs in Render
- Test SMTP connection separately
- Verify EMAIL_SECURE setting matches port (true for 465, false for 587)

### Database connection timeouts
- Check MongoDB Atlas network access settings
- Add 0.0.0.0/0 to IP whitelist (for testing)
- Verify connection string is correct
- Check if database cluster is running

## Post-Deployment Optimization

After successful deployment and verification:

- [ ] Set up CDN for static assets (if needed)
- [ ] Configure custom domain with SSL
- [ ] Set up monitoring and alerting
- [ ] Implement error tracking (e.g., Sentry)
- [ ] Set up database backups schedule
- [ ] Configure automatic scaling rules
- [ ] Optimize bundle sizes
- [ ] Enable compression
- [ ] Set up staging environment
- [ ] Document production runbook

## Maintenance

Regular tasks to perform:

### Weekly
- [ ] Review error logs
- [ ] Check API performance metrics
- [ ] Monitor database size and growth
- [ ] Review user feedback

### Monthly
- [ ] Update dependencies (with testing)
- [ ] Review and optimize slow database queries
- [ ] Check for security vulnerabilities
- [ ] Review and update rate limits if needed
- [ ] Backup verification test

### Quarterly
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Cost optimization review
- [ ] Disaster recovery drill

---

## Support Contacts

- **MongoDB Atlas Support**: https://support.mongodb.com/
- **Render Support**: https://render.com/docs/support
- **Vercel Support**: https://vercel.com/support
- **OpenAI Support**: https://help.openai.com/

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Build Optimization](https://vitejs.dev/guide/build.html)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
# 🚀 Aurikrex Academy - Complete Deployment Checklist

**Status**: ✅ Ready for Production Deployment  
**Date**: November 18, 2025  
**Architecture**: React Frontend (Vercel) + Node.js Backend (Render) + MongoDB (Atlas)

---

## 📋 Pre-Deployment Verification

### ✅ Completed Checklist Items

- [x] **Firebase References Removed**: All Firebase imports/configs completely removed from frontend
- [x] **Environment Variables Fixed**: VITE_API_BASE_URL → VITE_API_URL (corrected inconsistency)
- [x] **Backend .env Updated**: Added OPENAI_API_KEY and GEMINI_API_KEY placeholders
- [x] **MongoDB Connection**: Verified and working (IP whitelisted: 105.113.94.208)
- [x] **Email Service**: Gmail SMTP configured (aurikrexacademy@gmail.com with app password)
- [x] **Frontend Build**: ✅ Successfully builds with `npm run build`
  - Output: dist folder created with ~1.57 kB HTML, ~73.78 kB CSS, ~454.13 kB JS
  - No TypeScript errors
  - Gzip compression enabled
- [x] **Backend Build**: ✅ Successfully builds with `npm run build`
  - Output: dist/server.js created (~5.5 kB)
  - No TypeScript errors
  - ESM modules correctly configured
- [x] **Vercel Config**: ✅ vercel.json properly configured for SPA routing
  - SPA rewrites: All routes → /index.html
  - Asset caching headers for /assets/* (31536000s = 1 year)
  - Framework preset: Vite

---

## 🔧 Environment Configuration

### Frontend - Vercel Environment Variables

```
# Required variables to set in Vercel dashboard:
VITE_API_URL=https://aurikrex-backend.onrender.com/api
VITE_JWT_SECRET=c1ac45a722413b913d6bfa529524386a6c25ec1021202b73b335b03b977d97fa
VITE_APP_NAME=AurikrexAcademy
VITE_FRONTEND_URL=https://aurikrex.tech
```

**Current .env (Development)**:
```dotenv
VITE_API_URL=https://aurikrex-backend.onrender.com/api
VITE_JWT_SECRET=c1ac45a722413b913d6bfa529524386a6c25ec1021202b73b335b03b977d97fa
VITE_APP_NAME=AurikrexAcademy
VITE_FRONTEND_URL=https://aurikrex.tech
```

### Backend - Render Environment Variables

```
# Required variables to set in Render dashboard:
PORT=5000
NODE_ENV=production
ALLOWED_ORIGINS=https://aurikrex.tech,https://www.aurikrex.tech

MONGO_URI=REPLACE_WITH_YOUR_MONGO_URI
MONGO_DB_NAME=aurikrex-academy

JWT_SECRET=REPLACE_WITH_A_SECURE_32_CHAR_SECRET
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# Email Configuration (Brevo)
BREVO_API_KEY=REPLACE_WITH_YOUR_BREVO_API_KEY
BREVO_SENDER_EMAIL=no_reply@aurikrex.email
BREVO_SENDER_NAME=Aurikrex Academy
BREVO_TEMPLATE_ID=2

OPENAI_API_KEY=REPLACE_WITH_YOUR_OPENAI_API_KEY
GEMINI_API_KEY=REPLACE_WITH_YOUR_GEMINI_API_KEY

LOG_LEVEL=info
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

> **IMPORTANT:** Never commit actual secrets to source control.
> All credentials should be set via environment variables in your deployment platform.

**Current .env (Development)**:
```dotenv
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=https://aurikrex.tech,http://localhost:3000,http://localhost:8080

MONGO_URI=REPLACE_WITH_YOUR_MONGO_URI
MONGO_DB_NAME=aurikrex-academy

JWT_SECRET=REPLACE_WITH_A_SECURE_32_CHAR_SECRET
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# Email Configuration (Brevo)
BREVO_API_KEY=REPLACE_WITH_YOUR_BREVO_API_KEY
BREVO_SENDER_EMAIL=no_reply@aurikrex.email
BREVO_SENDER_NAME=Aurikrex Academy
BREVO_TEMPLATE_ID=2

OPENAI_API_KEY=REPLACE_WITH_YOUR_OPENAI_API_KEY
GEMINI_API_KEY=REPLACE_WITH_YOUR_GEMINI_API_KEY
```

---

## 🌐 Deployment Steps

### Step 1: Frontend Deployment (Vercel)

**Duration**: ~3-5 minutes

1. **Connect GitHub Repository**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select GitHub account and import "aurikrex-academy" repository
   - Select "aurikrex-academy" project

2. **Configure Build Settings**
   - **Project Name**: aurikrex
   - **Framework**: Vite (auto-detected)
   - **Root Directory**: aurikrex-frontend
   - **Build Command**: `npm run build`
   - **Output Directory**: dist
   - **Install Command**: `npm install` (default)

3. **Set Environment Variables**
   - Go to **Settings > Environment Variables**
   - Add all variables from "Frontend - Vercel Environment Variables" section above
   - Set for: Production, Preview, Development

4. **Configure Custom Domain** (if using custom domain)
   - Go to **Settings > Domains**
   - Add domain: aurikrex.tech
   - Update DNS records with Vercel CNAME

5. **Deploy**
   - Click "Deploy"
   - Monitor deployment progress
   - Verify deployment successful when all checks pass

6. **Post-Deployment Verification**
   - Visit deployment URL
   - Test signup flow
   - Verify environment variables loaded (API_URL correct)

### Step 2: Backend Deployment (Render)

**Duration**: ~5-10 minutes

1. **Create Render Web Service**
   - Go to [render.com](https://render.com)
   - Click "New +" > "Web Service"
   - Connect GitHub repository

2. **Configure Service**
   - **Name**: aurikrex-backend
   - **Repository**: komfalcon/aurikrex-academy
   - **Branch**: main
   - **Root Directory**: aurikrex-backend
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Paid if needed)

3. **Set Environment Variables**
   - Go to **Environment**
   - Add all variables from "Backend - Render Environment Variables" section
   - Make sure to update:
     - `OPENAI_API_KEY` - Add real OpenAI API key
     - `GEMINI_API_KEY` - Add real Gemini API key (optional)
     - `NODE_ENV` - Set to "production"

4. **Configure Auto-Deploy**
   - Enable "Auto-Deploy" from main branch

5. **Deploy**
   - Click "Create Web Service"
   - Monitor deployment logs
   - Wait for "Build successful" and "Service is running"

6. **Get Backend URL**
   - Copy the service URL (e.g., `https://aurikrex-backend.onrender.com`)
   - Update frontend `VITE_API_URL` if different

7. **Post-Deployment Verification**
   - Test health endpoint: `https://aurikrex-backend.onrender.com/health`
   - Should return: `{ "status": "OK", "uptime": ... }`
   - Test auth signup: POST `/api/auth/signup`
   - Verify email service works (OTP should arrive)

### Step 3: MongoDB Atlas Verification

**Duration**: ~2 minutes

1. **Verify IP Whitelisting**
   - Go to MongoDB Atlas > Network Access
   - Confirm Render server IP is whitelisted
   - If not, add Render IP or use "Allow access from anywhere" (0.0.0.0/0) for testing

2. **Check Database Connection**
   - Backend deployment logs should show:
     ```
     ✅ MongoDB connected successfully
     ✅ Database indexes created successfully
     ```

3. **Verify Collections**
   - Go to MongoDB Atlas > Browse Collections
   - Should see collections:
     - users
     - otpVerifications
     - lessons
     - lessonProgress
     - analytics

---

## ✅ Post-Deployment Testing

### 1. Authentication Flow Testing

#### Test Email Signup + OTP
```bash
POST https://aurikrex-backend.onrender.com/api/auth/signup
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "password": "SecurePass123!",
  "role": "student"
}

Expected Response (201):
{
  "success": true,
  "message": "Account created successfully. Please check your email for verification code.",
  "data": {
    "uid": "user-id",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "token": "jwt-token"
  }
}
```

**Verification**:
- [ ] Response status: 201
- [ ] Email received with OTP within 2 minutes
- [ ] User created in MongoDB

#### Test OTP Verification
```bash
POST https://aurikrex-backend.onrender.com/api/auth/verify-otp
{
  "email": "test@example.com",
  "otp": "123456"
}

Expected Response (200):
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "emailVerified": true
  }
}
```

**Verification**:
- [ ] Response status: 200
- [ ] User `emailVerified` field updated in MongoDB

#### Test Login (Verified User)
```bash
POST https://aurikrex-backend.onrender.com/api/auth/login
{
  "email": "test@example.com",
  "password": "SecurePass123!"
}

Expected Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "uid": "user-id",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "emailVerified": true,
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

**Verification**:
- [ ] Response status: 200
- [ ] JWT token returned
- [ ] Token stored in localStorage
- [ ] Dashboard loads with user data

### 2. Frontend Integration Testing

#### Test Signup Page
1. Navigate to https://aurikrex.tech/signup
2. Fill form with:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Password: SecurePass123!
3. Click "Create Account"
4. Should redirect to /verify-email page
5. Check email for OTP

**Verification**:
- [ ] Form validation works (password strength indicator)
- [ ] API call successful (network tab shows 201)
- [ ] Redirect to verify-email page
- [ ] Email received with OTP

#### Test OTP Verification
1. Copy OTP from email
2. Enter into 6-digit input boxes
3. Code should auto-submit on 6th digit
4. Should redirect to dashboard

**Verification**:
- [ ] OTP auto-submits when complete
- [ ] Success toast message appears
- [ ] Redirects to dashboard
- [ ] Dashboard displays "Welcome, Test! 👋"

#### Test Login Page
1. Navigate to https://aurikrex.tech/login
2. Enter email and password
3. Click "Sign In"
4. Should redirect to dashboard

**Verification**:
- [ ] Login successful
- [ ] JWT token stored
- [ ] Dashboard loads with user data

#### Test Google Sign-In
1. On signup or login page, click "Continue with Google"
2. Complete Google login flow
3. Should create/login user and redirect to dashboard

**Verification**:
- [ ] Google popup appears
- [ ] User creation successful (no OTP required)
- [ ] Dashboard loads after login

### 3. API Health Checks

```bash
# Health Check
GET https://aurikrex-backend.onrender.com/health
Expected: { "status": "OK", "uptime": ... }

# Get Current User
GET https://aurikrex-backend.onrender.com/api/auth/me
Headers: { "Authorization": "Bearer <jwt-token>" }
Expected: { "success": true, "data": { user object } }

# List Lessons
GET https://aurikrex-backend.onrender.com/api/lessons?page=1&limit=10
Expected: { "status": "success", "data": { "items": [], ... } }
```

**Verification**:
- [ ] Health check returns 200
- [ ] Auth endpoints return correct status
- [ ] CORS headers present in responses
- [ ] Database queries responsive

### 4. Frontend Build Verification

```bash
# Verify build output
cd aurikrex-frontend
npm run build

Expected:
✓ dist/index.html (1.57 kB)
✓ dist/assets/index-*.css (73.78 kB)
✓ dist/assets/index-*.js (454.13 kB)
```

**Verification**:
- [ ] Build completes without errors
- [ ] dist folder contains proper files
- [ ] No TypeScript errors in build log

### 5. Backend Build Verification

```bash
# Verify build output
cd aurikrex-backend
npm run build

Expected:
✓ dist/server.js
✓ dist/config/*
✓ dist/controllers/*
✓ dist/services/*
✓ All modules compiled successfully
```

**Verification**:
- [ ] Build completes without errors
- [ ] All .js files present in dist
- [ ] No TypeScript errors in build log

---

## 🔐 Security Checklist

- [ ] JWT_SECRET changed from placeholder to strong random string
- [ ] OPENAI_API_KEY added (real key, not placeholder)
- [ ] MongoDB credentials not exposed in frontend code
- [ ] CORS_ORIGIN whitelists only production domains
- [ ] NODE_ENV set to "production" on Render
- [ ] Email credentials secured (using app password, not main password)
- [ ] API rate limiting enabled (100 requests per 15 minutes)
- [ ] HTTPS enforced on all domains
- [ ] Sensitive logs disabled in production (LOG_LEVEL=info)

---

## 📊 Performance Checklist

- [ ] Frontend gzip compression enabled (12.41 kB CSS, 138.04 kB JS)
- [ ] Asset caching configured (1-year cache for /assets/*)
- [ ] SPA rewrites configured (/ routes → index.html)
- [ ] MongoDB indexes created (verified in Atlas)
- [ ] Email service tested (OTP delivery < 2 minutes)
- [ ] API response times < 500ms
- [ ] Database queries optimized

---

## 🔄 Rollback Plan

If deployment issues occur:

1. **Frontend Rollback**
   - Vercel automatically keeps previous deployments
   - Go to Deployments tab and click "Promote" on previous version
   - Or redeploy from different Git branch

2. **Backend Rollback**
   - Render keeps deployment history
   - Go to Logs > Deploys and click "Redeploy" on previous version
   - Or push previous commit to main branch and auto-redeploy

3. **Database Rollback**
   - MongoDB Atlas has automatic backups
   - Contact support to restore from previous snapshot if needed

---

## 📞 Support & Troubleshooting

### Frontend Issues

**Problem**: Signup page shows "Connection refused"
- **Solution**: Verify `VITE_API_URL` in Vercel environment variables matches backend URL

**Problem**: OTP not received
- **Solution**: Check backend logs for email errors; verify Gmail credentials in Render

**Problem**: Page shows blank after build
- **Solution**: Verify vercel.json SPA rewrites configured; check browser console for JS errors

### Backend Issues

**Problem**: Database connection error
- **Solution**: Verify MongoDB IP whitelisting; check MONGO_URI format

**Problem**: Email service failing
- **Solution**: Verify EMAIL_USER and EMAIL_PASS are correct; check Gmail app password

**Problem**: High memory usage
- **Solution**: Check for memory leaks in logs; scale up Render plan if needed

### Monitoring & Alerts

Set up monitoring on:
- Vercel: Real User Monitoring (RUM)
- Render: Email alerts on deployment failure
- MongoDB: Database monitoring and alerts
- Gmail: Monitor for bounced emails

---

## 📝 Final Checklist Before Going Live

- [ ] All environment variables set in Vercel
- [ ] All environment variables set in Render
- [ ] Frontend build successful (npm run build)
- [ ] Backend build successful (npm run build)
- [ ] All 5 API endpoints tested
- [ ] Email signup → OTP → verification flow works
- [ ] Login flow works
- [ ] Google Sign-In works
- [ ] Dashboard displays correctly
- [ ] MongoDB connection verified
- [ ] CORS configured correctly
- [ ] SSL/TLS certificates valid
- [ ] Domain DNS records configured
- [ ] Monitoring and alerts enabled
- [ ] Error tracking (Sentry or equivalent) enabled
- [ ] Team notified of deployment time
- [ ] Rollback plan documented and tested

---

## 🎉 Deployment Complete!

Once all items checked, your Aurikrex Academy application is ready for production:

- ✅ Frontend: https://aurikrex.tech (Vercel)
- ✅ Backend: https://aurikrex-backend.onrender.com (Render)
- ✅ Database: MongoDB Atlas
- ✅ Authentication: Email OTP + Google Sign-In
- ✅ Lessons: AI-powered lesson generation
- ✅ Email: Gmail SMTP notifications

**Success Metrics**:
- Page Load Time: < 3 seconds
- API Response Time: < 500ms
- Email Delivery: < 2 minutes
- User Experience: Smooth auth flow, no errors

---

**Created**: November 18, 2025  
**Version**: 1.0  
**Status**: Ready for Production
