# Aurikrex Academy - Deployment Checklist (DigitalOcean)

## Overview
This document provides a comprehensive checklist for deploying the Aurikrex Academy authentication system after migrating from Render to DigitalOcean. Follow these steps to ensure everything is configured correctly.

---

## 🔧 Backend Configuration (DigitalOcean App Platform)

### 1. Environment Variables

Ensure the following environment variables are set in your DigitalOcean App Platform backend settings:

#### Server Configuration
```bash
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
```

#### Database Configuration
```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/aurikrex-academy?retryWrites=true&w=majority
MONGO_DB_NAME=aurikrex-academy
```
⚠️ **Important**: Ensure MongoDB Atlas IP Whitelist includes DigitalOcean App Platform IPs or use `0.0.0.0/0` for testing (not recommended for production).

#### Security & JWT Configuration
```bash
JWT_SECRET=<your-super-secret-jwt-key-at-least-32-characters>
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d
```

#### CORS & URLs
```bash
ALLOWED_ORIGINS=https://aurikrex.tech,https://www.aurikrex.tech
BACKEND_URL=https://your-backend-app.ondigitalocean.app
FRONTEND_URL=https://aurikrex.tech
```
⚠️ **Important**: Replace `your-backend-app` with your actual DigitalOcean app name.

#### Brevo Email Configuration
```bash
BREVO_API_KEY=<your-brevo-api-key>
BREVO_SENDER_EMAIL=info@aurikrex.tech
BREVO_SENDER_NAME=Aurikrex Academy
```
📧 **Get your API key from**: https://app.brevo.com/settings/keys/api

#### Google OAuth Configuration
```bash
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://your-backend-app.ondigitalocean.app/api/auth/google/callback
```
🔗 **Get credentials from**: https://console.cloud.google.com

#### AI Services (Optional)
```bash
OPENAI_API_KEY=sk-<your-openai-api-key>
GEMINI_API_KEY=<your-gemini-api-key>
CLAUDE_API_KEY=<your-claude-api-key>
```

#### Rate Limiting (Optional)
```bash
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### 2. MongoDB Atlas Configuration

- [ ] **IP Whitelist**: Add DigitalOcean App Platform IP addresses to MongoDB Atlas Network Access
  - Go to MongoDB Atlas → Network Access → Add IP Address
  - Option 1: Add specific DigitalOcean IPs (more secure)
  - Option 2: Add `0.0.0.0/0` to allow all IPs (less secure, use only for testing)

- [ ] **Database User**: Ensure the database user has read/write access to the `aurikrex-academy` database

- [ ] **Connection String**: Verify the `MONGO_URI` format:
  ```
  mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
  ```

### 3. DigitalOcean App Platform Settings

- [ ] **Build Command**: `npm run build`
- [ ] **Run Command**: `npm start`
- [ ] **Environment**: Production
- [ ] **HTTP Port**: 5000 (or value of PORT environment variable)
- [ ] **Health Check Endpoint**: `/health`

---

## 🌐 Frontend Configuration (Vercel)

### 1. Environment Variables

Set the following environment variables in your Vercel project settings:

```bash
VITE_API_URL=https://your-backend-app.ondigitalocean.app/api
VITE_FRONTEND_URL=https://aurikrex.tech
VITE_APP_NAME=AurikrexAcademy
```

⚠️ **Important**: 
- Replace `your-backend-app` with your actual DigitalOcean app name
- DO NOT include a trailing slash in `VITE_API_URL`
- The `VITE_` prefix is required for Vite to expose variables to the frontend

### 2. Vercel Settings

- [ ] **Build Command**: `npm run build`
- [ ] **Output Directory**: `dist`
- [ ] **Install Command**: `npm install`
- [ ] **Node Version**: 18.x or higher

---

## 🔐 Google OAuth Setup

### 1. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project or create a new one
3. Navigate to: **APIs & Services > Credentials**
4. Create or update OAuth 2.0 Client ID

### 2. Authorized Redirect URIs

Add the following redirect URIs to your Google OAuth Client:

```
Production:
https://your-backend-app.ondigitalocean.app/api/auth/google/callback

Local Development:
http://localhost:5000/api/auth/google/callback
```

⚠️ **Important**: Replace `your-backend-app` with your actual DigitalOcean app name.

### 3. Authorized JavaScript Origins

Add the following origins:

```
Production Frontend:
https://aurikrex.tech
https://www.aurikrex.tech

Production Backend:
https://your-backend-app.ondigitalocean.app

Local Development:
http://localhost:8080
http://localhost:5000
```

---

## 📧 Brevo Email Configuration

### 1. Brevo Account Setup

- [ ] Sign up or log in to [Brevo](https://app.brevo.com)
- [ ] Navigate to **Settings > API Keys**
- [ ] Create a new API key (or use existing one)
- [ ] Copy the API key and set it as `BREVO_API_KEY` in backend environment variables

### 2. Sender Email Verification

- [ ] Verify your sender email address (`info@aurikrex.tech`)
- [ ] Go to **Settings > Senders & IP**
- [ ] Add and verify your sender email
- [ ] Complete domain authentication (SPF, DKIM records)

### 3. Domain Authentication (Recommended)

1. Go to **Settings > Senders & IP > Domains**
2. Add your domain (`aurikrex.tech`)
3. Add the following DNS records to your domain:

   **SPF Record:**
   ```
   Type: TXT
   Host: @
   Value: v=spf1 include:spf.sendinblue.com mx ~all
   ```

   **DKIM Record:**
   ```
   Type: TXT
   Host: mail._domainkey
   Value: [Provided by Brevo]
   ```

   **DMARC Record (Optional):**
   ```
   Type: TXT
   Host: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:dmarc@aurikrex.tech
   ```

---

## ✅ Testing Checklist

### Backend Health Check
```bash
curl https://your-backend-app.ondigitalocean.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "environment": "production",
  "services": {
    "database": "connected",
    "databaseLatency": "...ms",
    "collections": [...]
  },
  "message": "Aurikrex Backend is healthy!"
}
```

### 1. Email Signup Flow
- [ ] Navigate to `https://aurikrex.tech/signup`
- [ ] Fill in the signup form with valid information
- [ ] Submit the form
- [ ] Check email for OTP verification code
- [ ] Enter OTP on verification page
- [ ] Verify successful login and redirect to dashboard

### 2. Email Login Flow (Verified User)
- [ ] Navigate to `https://aurikrex.tech/login`
- [ ] Enter email and password for verified account
- [ ] Submit the form
- [ ] Verify successful login and redirect to dashboard

### 3. Email Login Flow (Unverified User)
- [ ] Create a new account but don't verify email
- [ ] Try to log in with unverified account
- [ ] Verify you receive error: "Email not verified. Please verify your email before logging in."
- [ ] Verify redirect to verification page

### 4. Google OAuth Flow
- [ ] Navigate to `https://aurikrex.tech/login`
- [ ] Click "Sign in with Google" button
- [ ] Complete Google authentication
- [ ] Verify successful redirect back to application
- [ ] Verify user is logged in and redirected to dashboard
- [ ] Check that user data is stored correctly

### 5. OTP Expiration
- [ ] Sign up with a new account
- [ ] Wait 10+ minutes before entering OTP
- [ ] Try to verify with expired OTP
- [ ] Verify you receive error: "Invalid or expired verification code"
- [ ] Request a new OTP
- [ ] Verify new OTP works correctly

### 6. OTP Resend
- [ ] Sign up with a new account
- [ ] Click "Resend OTP" button
- [ ] Check email for new OTP
- [ ] Verify new OTP works correctly

---

## 🔍 Common Issues & Solutions

### Issue 1: "CORS Error" or "Network Error"

**Possible Causes:**
- Incorrect `ALLOWED_ORIGINS` in backend
- Incorrect `VITE_API_URL` in frontend
- Backend not accessible from frontend domain

**Solutions:**
1. Verify `ALLOWED_ORIGINS` includes your frontend domain (with and without `www`)
2. Verify `VITE_API_URL` points to correct backend URL
3. Test backend health endpoint directly from browser
4. Check DigitalOcean App Platform logs for errors

### Issue 2: "MongoDB Connection Failed"

**Possible Causes:**
- MongoDB IP whitelist doesn't include DigitalOcean IPs
- Incorrect connection string
- Database user permissions issue

**Solutions:**
1. Add `0.0.0.0/0` to MongoDB Network Access (temporary for testing)
2. Verify `MONGO_URI` format and credentials
3. Check MongoDB Atlas user has correct permissions
4. Review DigitalOcean App Platform logs

### Issue 3: "Email Not Sent" or "Failed to send verification email"

**Possible Causes:**
- Invalid Brevo API key
- Sender email not verified
- Domain not authenticated

**Solutions:**
1. Verify `BREVO_API_KEY` is correct
2. Check sender email is verified in Brevo dashboard
3. Complete domain authentication (SPF, DKIM)
4. Test Brevo API key using Brevo's API testing tool

### Issue 4: "Google OAuth Failed" or "Redirect URI Mismatch"

**Possible Causes:**
- Redirect URI not configured in Google Cloud Console
- Incorrect `GOOGLE_CALLBACK_URL` in backend
- Wrong client ID or secret

**Solutions:**
1. Verify redirect URI in Google Cloud Console matches `GOOGLE_CALLBACK_URL`
2. Ensure `BACKEND_URL` is set correctly
3. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
4. Check authorized JavaScript origins include frontend domain

### Issue 5: "Invalid Token" or "Token Expired"

**Possible Causes:**
- `JWT_SECRET` mismatch between deployments
- Token expiry configuration issue

**Solutions:**
1. Ensure `JWT_SECRET` is same across all backend instances
2. Verify `ACCESS_TOKEN_EXPIRY` and `REFRESH_TOKEN_EXPIRY` are set
3. Clear browser localStorage and try again
4. Generate new token by logging in again

---

## 🚀 Deployment Steps Summary

### Backend (DigitalOcean)
1. Set all environment variables in App Platform settings
2. Deploy backend application
3. Verify `/health` endpoint is accessible
4. Check logs for any errors

### Frontend (Vercel)
1. Set environment variables in Vercel project settings
2. Trigger a new deployment
3. Verify build completes successfully
4. Test application in browser

### Post-Deployment
1. Run through all test cases in Testing Checklist
2. Monitor logs for any errors
3. Test authentication flows from multiple devices/browsers
4. Verify email delivery and OTP functionality

---

## 📊 Monitoring & Logs

### Backend Logs (DigitalOcean)
- Go to your DigitalOcean App Platform dashboard
- Select your backend app
- Navigate to **Runtime Logs** tab
- Monitor for errors, warnings, or unusual activity

### Frontend Logs (Vercel)
- Go to your Vercel project dashboard
- Navigate to **Deployments**
- Click on the latest deployment
- Check **Build Logs** and **Runtime Logs**

### MongoDB Atlas Monitoring
- Go to MongoDB Atlas dashboard
- Navigate to **Monitoring** tab
- Check for connection issues, slow queries, or errors

### Brevo Email Logs
- Go to Brevo dashboard
- Navigate to **Statistics > Email**
- Check delivery rates, bounces, and spam reports

---

## 🔐 Security Best Practices

### Environment Variables
- [ ] Never commit `.env` files to git
- [ ] Use strong, randomly generated `JWT_SECRET` (minimum 32 characters)
- [ ] Rotate secrets regularly (every 90 days recommended)
- [ ] Use different secrets for development and production

### MongoDB
- [ ] Use strong database passwords (minimum 16 characters, mixed case, numbers, symbols)
- [ ] Restrict IP access to known sources only
- [ ] Enable MongoDB Atlas encryption at rest
- [ ] Enable audit logging

### API Security
- [ ] Keep rate limiting enabled
- [ ] Monitor for unusual authentication patterns
- [ ] Enable HTTPS only (no HTTP)
- [ ] Keep dependencies up to date

### OAuth
- [ ] Restrict authorized redirect URIs to known domains
- [ ] Regularly review OAuth consent screen settings
- [ ] Monitor OAuth token usage in Google Cloud Console

---

## 📝 Maintenance

### Regular Tasks
- [ ] Review logs weekly for errors or warnings
- [ ] Update dependencies monthly (security patches)
- [ ] Rotate JWT secret every 90 days
- [ ] Review MongoDB performance and optimize queries
- [ ] Check email delivery rates and reputation

### Backup & Recovery
- [ ] Enable MongoDB Atlas automated backups
- [ ] Test backup restoration process quarterly
- [ ] Document recovery procedures
- [ ] Keep backup of environment variables in secure location

---

## 📞 Support & Resources

### Documentation
- MongoDB Atlas: https://docs.atlas.mongodb.com
- DigitalOcean App Platform: https://docs.digitalocean.com/products/app-platform
- Vercel: https://vercel.com/docs
- Brevo: https://developers.brevo.com
- Google OAuth: https://developers.google.com/identity/protocols/oauth2

### Get Help
- GitHub Issues: https://github.com/komfalcon/aurikrex-academy/issues
- DigitalOcean Support: https://cloud.digitalocean.com/support
- Vercel Support: https://vercel.com/support

---

## ✨ Changes Made in This Migration

### Backend
- ✅ Removed all Render references (hardcoded URLs)
- ✅ Removed Firebase authentication dependencies
- ✅ Replaced `console.log` with Winston logger for production
- ✅ Ensured Google OAuth uses `BACKEND_URL` environment variable
- ✅ Verified JWT uses environment variables for secrets and expiry
- ✅ Verified OTP generation is secure (6-digit, 10-minute expiry)
- ✅ Verified Brevo integration for email sending
- ✅ Verified unverified users cannot login

### Frontend
- ✅ Removed Lovable Cloud tagger dependency
- ✅ Verified API URL uses environment variable
- ✅ Verified frontend correctly calls backend authentication endpoints

### Environment Configuration
- ✅ Updated `.env.example` files with correct DigitalOcean configuration
- ✅ Removed Firebase environment variables
- ✅ Added Brevo environment variables
- ✅ Added proper URL configuration (BACKEND_URL, FRONTEND_URL)

---

## 🎯 Final Checklist

Before going live, ensure:

- [ ] All backend environment variables are set in DigitalOcean
- [ ] All frontend environment variables are set in Vercel
- [ ] MongoDB IP whitelist is configured
- [ ] Google OAuth redirect URIs are configured
- [ ] Brevo sender email is verified and domain authenticated
- [ ] Backend `/health` endpoint returns success
- [ ] All authentication flows tested and working
- [ ] No legacy service references remain in code
- [ ] Logs are being generated and accessible
- [ ] Security best practices are followed

---

**Last Updated**: December 9, 2024
**Migration Status**: ✅ Complete
**Legacy Services Removed**: Render, Firebase, Lovable Cloud
**New Services**: DigitalOcean App Platform, MongoDB Atlas, Brevo, Google OAuth
