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
ALLOWED_ORIGINS=https://aurikrex.tech,https://aurikrex-academy12.web.app,https://vercel-deployment-url.vercel.app

MONGO_URI=mongodb+srv://moparaji57_db_user:bcGb5OueuJ0LEPqW@cluster0.sknrqn8.mongodb.net/aurikrex-academy?retryWrites=true&w=majority
MONGO_DB_NAME=aurikrex-academy

JWT_SECRET=c1ac45a722413b913d6bfa529524386a6c25ec1021202b73b335b03b977d97fa
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=aurikrexacademy@gmail.com
EMAIL_PASS=jssf erzj wqqx yeip

OPENAI_API_KEY=sk-YOUR-REAL-KEY-HERE
GEMINI_API_KEY=YOUR-GEMINI-API-KEY-HERE

LOG_LEVEL=info
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

**Current .env (Development)**:
```dotenv
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=https://aurikrex-academy12.web.app,https://aurikrex.tech,http://localhost:3000,http://localhost:8080

MONGO_URI=mongodb+srv://moparaji57_db_user:bcGb5OueuJ0LEPqW@cluster0.sknrqn8.mongodb.net/aurikrex-academy?retryWrites=true&w=majority
MONGO_DB_NAME=aurikrex-academy

JWT_SECRET=c1ac45a722413b913d6bfa529524386a6c25ec1021202b73b335b03b977d97fa
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=aurikrexacademy@gmail.com
EMAIL_PASS=jssf erzj wqqx yeip

OPENAI_API_KEY=sk-placeholder-key-add-real-key-for-lesson-generation
GEMINI_API_KEY=optional-gemini-api-key
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
