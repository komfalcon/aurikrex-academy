# Quick Start Guide - Aurikrex Academy

**Ready to deploy?** Follow these 3 simple steps to get your authentication system live!

---

## 🚀 Step 1: Google OAuth Setup (15 minutes)

### 1.1 Go to Google Cloud Console
Visit: https://console.cloud.google.com

### 1.2 Create/Select Project
- Create new project: "Aurikrex Academy"
- Or select existing project

### 1.3 Create OAuth Credentials
1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"OAuth client ID"**
3. Choose **"Web application"**
4. Configure:
   - **Name**: Aurikrex Academy Web Client
   - **Authorized JavaScript origins**:
     ```
     https://aurikrex.tech
     ```
   - **Authorized redirect URIs**:
     ```
     https://aurikrex-backend.onrender.com/api/auth/google/callback
     ```
5. Click **"Create"**
6. **📋 COPY** Client ID and Client Secret (you'll need these!)

### 1.4 Configure OAuth Consent Screen
1. Go to **"APIs & Services"** > **"OAuth consent screen"**
2. Choose **"External"**
3. Fill in:
   - **App name**: Aurikrex Academy
   - **Support email**: info@aurikrex.tech
   - **Authorized domains**: `aurikrex.tech`
4. Add scopes: `email`, `profile`, `openid`
5. Save

---

## ⚙️ Step 2: Configure Environment Variables (10 minutes)

### 2.1 Backend (Render)
Go to: https://dashboard.render.com → Your Service → Environment

**Add these variables**:
```bash
# Google OAuth (NEW - use values from Step 1)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://aurikrex-backend.onrender.com/api/auth/google/callback
FRONTEND_URL=https://aurikrex.tech

# CORS (IMPORTANT)
ALLOWED_ORIGINS=https://aurikrex.tech,https://www.aurikrex.tech

# Other required variables (if not already set)
NODE_ENV=production
MONGO_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-32-character-minimum-secret
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=info@aurikrex.tech
EMAIL_PASS=your-email-password
```

**Save and wait for automatic redeploy** (2-3 minutes)

### 2.2 Frontend (Vercel)
Go to: https://vercel.com → Your Project → Settings → Environment Variables

**Verify these are set**:
```bash
VITE_API_URL=https://aurikrex-backend.onrender.com/api
VITE_FRONTEND_URL=https://aurikrex.tech
```

**Save and redeploy if needed**

### 2.3 MongoDB Atlas
Go to: https://cloud.mongodb.com → Network Access

**Add Render IP to whitelist**:
- Option 1 (Easy): Allow access from anywhere: `0.0.0.0/0`
- Option 2 (Secure): Add Render's specific IP address

**Save**

---

## ✅ Step 3: Test Everything (5 minutes)

### 3.1 Test Email Signup
1. Go to **https://aurikrex.tech/signup**
2. Fill in the signup form
3. Click **"Sign Up"**
4. Check your email for OTP code
5. Enter OTP on verification page
6. Should land on **Dashboard** ✅

### 3.2 Test Google OAuth
1. Go to **https://aurikrex.tech/signup**
2. Click **"Sign up with Google"**
3. Select your Google account
4. Grant permissions
5. Should land on **Dashboard** ✅

### 3.3 Test Login
1. Go to **https://aurikrex.tech/login**
2. Enter email and password
3. Click **"Log In"**
4. Should land on **Dashboard** ✅

---

## 🎉 Done!

Your authentication system is now live with:
- ✅ Email signup with OTP verification
- ✅ Google OAuth signup and login
- ✅ Secure JWT authentication
- ✅ Protected dashboard

---

## 🆘 Troubleshooting

### "redirect_uri_mismatch" Error
**Fix**: Check that redirect URI in Google Console exactly matches:
```
https://aurikrex-backend.onrender.com/api/auth/google/callback
```

### OTP Email Not Received
**Fix**: 
1. Check spam folder
2. Verify EMAIL_USER and EMAIL_PASS in Render
3. Test with different email provider

### "Cannot connect to backend"
**Fix**:
1. Check that VITE_API_URL is correct in Vercel
2. Verify backend is running (visit `/health` endpoint)
3. Check CORS settings in Render

### MongoDB Connection Error
**Fix**:
1. Add `0.0.0.0/0` to MongoDB Atlas whitelist
2. Verify MONGO_URI connection string

---

## 📚 Need More Help?

See detailed guides:
- **GOOGLE_OAUTH_SETUP.md** - Complete OAuth setup
- **DEPLOYMENT_CONFIGURATION.md** - Full deployment guide
- **FINAL_AUDIT_REPORT.md** - Complete system documentation

---

## 🔗 Important URLs

- **Frontend**: https://aurikrex.tech
- **Backend API**: https://aurikrex-backend.onrender.com/api
- **Health Check**: https://aurikrex-backend.onrender.com/health
- **Google Console**: https://console.cloud.google.com
- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com
- **MongoDB Atlas**: https://cloud.mongodb.com

---

**Questions?** Check the documentation files or contact your development team.

**Ready to go live?** 🚀 Follow the 3 steps above and you're done!
