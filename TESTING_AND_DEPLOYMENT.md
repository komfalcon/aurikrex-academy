# Authentication Testing & Deployment Guide

## Quick Start - Local Development

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Titan Mail account (or other SMTP service)
- Firebase project (for Google OAuth)

---

## Step 1: Environment Setup

### Backend Configuration

1. **Navigate to backend:**
   ```bash
   cd aurikrex-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure .env file:**
   
   The `.env` file is already created with template values. Update these critical fields:

   ```env
   # ⚠️ REQUIRED: Update this with your actual Titan Mail password
   EMAIL_PASS=your-actual-titan-mail-password

   # ⚠️ OPTIONAL: Update if you have different MongoDB credentials
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/aurikrex-academy

   # ⚠️ PRODUCTION: Change this to a secure random string
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
   ```

4. **Verify Firebase Admin credentials** (already in .env):
   - These are for backend Google OAuth verification
   - Current values should work if using aurikrex-academy1 Firebase project

### Frontend Configuration

1. **Navigate to frontend:**
   ```bash
   cd ../aurikrex-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure .env file:**
   
   Update with your actual Firebase Web App credentials:

   ```env
   # Get these from Firebase Console > Project Settings > General > Your apps
   VITE_FIREBASE_API_KEY=your-actual-api-key
   VITE_FIREBASE_AUTH_DOMAIN=aurikrex-academy1.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=aurikrex-academy1
   VITE_FIREBASE_STORAGE_BUCKET=aurikrex-academy1.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id

   # Backend API URL (use localhost for development)
   VITE_API_URL=http://localhost:5000/api
   ```

   **To get Firebase credentials:**
   1. Go to [Firebase Console](https://console.firebase.google.com/)
   2. Select your project (aurikrex-academy1)
   3. Click gear icon > Project Settings
   4. Scroll to "Your apps" section
   5. If no web app exists, click "Add app" and select Web (</> icon)
   6. Copy the config values to your `.env`

---

## Step 2: Start Development Servers

### Start Backend (Terminal 1)
```bash
cd aurikrex-backend
npm run dev
```

**Expected output:**
```
🔌 Initializing MongoDB connection...
✅ MongoDB connected successfully
📊 Creating database indexes...
✅ Database indexes created successfully

============================================================
🚀 Aurikrex Academy Backend Server
============================================================
📍 Environment: development
🌐 Port: 5000
🔗 API URL: http://localhost:5000/api
🏥 Health Check: http://localhost:5000/health
============================================================
```

### Start Frontend (Terminal 2)
```bash
cd aurikrex-frontend
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

## Step 3: Testing Authentication Flows

### Test 1: Email/Password Signup & Verification

1. **Open browser:** http://localhost:5173/signup

2. **Fill signup form:**
   - First Name: John
   - Last Name: Doe
   - Email: your-test-email@gmail.com
   - Phone: (optional)
   - Password: Test@123456 (meets all requirements)
   - Confirm Password: Test@123456

3. **Submit form** → Expected results:
   - ✅ Backend console: "🔐 Signup request received"
   - ✅ Backend console: "✅ User registered successfully"
   - ✅ Backend console: "✅ Verification OTP sent"
   - ✅ Frontend: Success toast "Account created! Check email..."
   - ✅ Redirected to /verify-email

4. **Check your email** for verification code (6 digits)

5. **Enter OTP** in verification page → Expected results:
   - ✅ Backend console: "🔐 OTP verification request"
   - ✅ Backend console: "✅ OTP verified"
   - ✅ Backend console: "✅ Email verified for user"
   - ✅ Frontend: Success toast "Email verified successfully!"
   - ✅ Redirected to /dashboard

### Test 2: Email/Password Login

1. **Open browser:** http://localhost:5173/login

2. **Fill login form:**
   - Email: your-test-email@gmail.com
   - Password: Test@123456

3. **Submit form** → Expected results:
   - ✅ Backend console: "🔐 Login request received"
   - ✅ Backend console: "✅ User logged in successfully"
   - ✅ Frontend: Success toast "Welcome back, John!"
   - ✅ localStorage contains: aurikrex-user, aurikrex-token, aurikrex-refresh-token
   - ✅ Redirected to /dashboard

### Test 3: Google Sign-In

1. **Open browser:** http://localhost:5173/login

2. **Click "Sign in with Google"** → Expected results:
   - ✅ Google popup appears
   - ✅ Select Google account
   - ✅ Backend console: "🔐 Google sign-in request received"
   - ✅ Backend console: "✅ Google ID token verified"
   - ✅ Backend console: "✅ Google sign-in successful"
   - ✅ Frontend: Success toast "Welcome back!"
   - ✅ Redirected to /dashboard

### Test 4: OTP Resend

1. **During signup verification**, click "Resend Code" → Expected results:
   - ✅ Backend console: "🔐 Resend OTP request"
   - ✅ Backend console: "✅ Verification OTP resent"
   - ✅ Frontend: Success toast "Verification code sent!"
   - ✅ New email received with new OTP
   - ✅ 60-second cooldown timer starts

### Test 5: Login (Unverified Account)

1. **Create account but DON'T verify email**

2. **Try to login** → Expected results:
   - ✅ Backend console: "⚠️ Invalid credentials" or similar
   - ✅ Frontend: Error toast "Account not verified"
   - ✅ Redirected to /verify-email after 2 seconds

---

## Step 4: Verify Backend Health

### Health Check Endpoint
```bash
curl http://localhost:5000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-14T00:00:00.000Z",
  "environment": "development",
  "services": {
    "database": "connected",
    "databaseLatency": "45ms",
    "collections": ["users", "lessons", "analytics", "otpVerifications"]
  },
  "message": "Aurikrex Backend is healthy!"
}
```

### Test Signup API Directly
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "Test@123456"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email for verification code.",
  "data": {
    "uid": "...",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

## Step 5: Troubleshooting

### Issue: "MongoDB connection failed"

**Check:**
1. `.env` has correct MONGO_URI
2. MongoDB Atlas IP whitelist includes your IP (or 0.0.0.0/0 for development)
3. Network allows connections to MongoDB Atlas

**Solution:**
```bash
# Test MongoDB connection
cd aurikrex-backend
node -e "require('dotenv').config(); console.log(process.env.MONGO_URI)"
```

### Issue: "Email not sent" or "OTP not received"

**Check:**
1. `.env` has EMAIL_PASS configured
2. Titan Mail credentials are correct
3. Check spam folder

**Test email service:**
```bash
cd aurikrex-backend
npm run dev
# Watch console for "✅ Email service is ready to send emails"
```

### Issue: "Failed to sign in with Google"

**Check:**
1. Frontend `.env` has correct Firebase credentials
2. Google sign-in is enabled in Firebase Console
3. Authorized domains include localhost in Firebase Console

**Fix:**
1. Go to Firebase Console > Authentication > Sign-in method
2. Enable Google provider
3. Add localhost to authorized domains

### Issue: "CORS error" in browser console

**Check:**
1. Backend `.env` has ALLOWED_ORIGINS including your frontend URL
2. Frontend is running on expected port (5173 or 3000)

**Fix:**
```env
# In aurikrex-backend/.env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Issue: "Token expired" errors

**This is normal behavior after 1 hour!**

**Solution:** Implement token refresh:
```javascript
// Frontend code to refresh token
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('aurikrex-refresh-token');
  const response = await fetch('http://localhost:5000/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  const data = await response.json();
  localStorage.setItem('aurikrex-token', data.data.accessToken);
};
```

---

## Step 6: Production Deployment

### Deploy Backend to Render

1. **Create Render account:** https://render.com

2. **New Web Service:**
   - Connect GitHub repository: komfalcon/aurikrex-academy
   - Root directory: `aurikrex-backend`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

3. **Environment Variables** (Add all from .env):
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=[your MongoDB Atlas URI]
   ALLOWED_ORIGINS=https://aurikrex.tech,https://www.aurikrex.tech,[your-frontend-url]
   JWT_SECRET=[generate new secure secret]
   EMAIL_HOST=smtp.titan.email
   EMAIL_PORT=465
   EMAIL_SECURE=true
   EMAIL_USER=info@aurikrex.tech
   EMAIL_PASS=[your password]
   FIREBASE_PROJECT_ID=aurikrex-academy1
   FIREBASE_PRIVATE_KEY=[your key - keep quotes and newlines]
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@aurikrex-academy1.iam.gserviceaccount.com
   OPENAI_API_KEY=[your key]
   GEMINI_API_KEY=[your key]
   ```

4. **Deploy!**

5. **Note your Render URL:** `https://aurikrex-backend.onrender.com`

### Deploy Frontend

1. **Update frontend .env:**
   ```env
   VITE_API_URL=https://aurikrex-backend.onrender.com/api
   ```

2. **Build frontend:**
   ```bash
   cd aurikrex-frontend
   npm run build
   ```

3. **Deploy to hosting** (Vercel/Netlify/Firebase):
   
   **Vercel:**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

   **Netlify:**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

4. **Update CORS in backend:**
   - Add your frontend URL to ALLOWED_ORIGINS in Render environment variables
   - Example: `https://aurikrex.tech,https://your-app.vercel.app`

### Configure Custom Domain (aurikrex.tech)

1. **In Render:**
   - Go to your service settings
   - Add custom domain: `api.aurikrex.tech`
   - Update DNS records as instructed

2. **In your frontend deployment:**
   - Add custom domain: `aurikrex.tech`
   - Update DNS records

3. **Update backend CORS:**
   ```env
   ALLOWED_ORIGINS=https://aurikrex.tech,https://www.aurikrex.tech,https://api.aurikrex.tech
   ```

---

## Step 7: Post-Deployment Verification

### Test Production APIs

1. **Health check:**
   ```bash
   curl https://aurikrex-backend.onrender.com/health
   ```

2. **Signup (should return 400 for missing fields - that's good!):**
   ```bash
   curl https://aurikrex-backend.onrender.com/api/auth/signup
   ```

3. **Check CORS:**
   - Open https://aurikrex.tech in browser
   - Try to sign up or login
   - Check browser console for CORS errors

### Monitor Logs

**Render Dashboard:**
- View real-time logs
- Check for errors
- Monitor request counts

**MongoDB Atlas:**
- Check connection logs
- Verify user collection is being populated
- Monitor database performance

---

## Security Checklist

Before going live:

- [ ] Change JWT_SECRET to a secure random string (at least 32 characters)
- [ ] Verify EMAIL_PASS is not committed to Git
- [ ] Check .gitignore includes .env files
- [ ] Verify Firebase private key is secure
- [ ] Enable MongoDB Atlas IP whitelist for production
- [ ] Add rate limiting to sensitive endpoints
- [ ] Set up SSL/TLS (automatic with Render)
- [ ] Test all authentication flows in production
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Enable backup for MongoDB Atlas

---

## Maintenance

### Regular Tasks

**Weekly:**
- Check error logs in Render
- Monitor MongoDB Atlas performance
- Review authentication success/failure rates

**Monthly:**
- Rotate JWT secret (requires user re-login)
- Review and update dependencies
- Check for security vulnerabilities: `npm audit`

### Updating Code

```bash
# Make changes locally
git add .
git commit -m "Update authentication flow"
git push

# Render will auto-deploy from main branch
# Or manually deploy specific branch in Render dashboard
```

---

## Need Help?

### Common Questions

**Q: How do I reset a user's password?**
A: Currently not implemented. Add a "Forgot Password" flow that:
1. Sends OTP to email
2. Verifies OTP
3. Allows password reset

**Q: Can users change their email?**
A: Not currently. Would need to:
1. Send OTP to new email
2. Verify OTP
3. Update email in database
4. Re-verify email

**Q: How do I delete a user?**
A: Use MongoDB Compass or:
```javascript
await UserModel.delete(userId);
```

**Q: How do I manually verify a user's email?**
A: In MongoDB Compass:
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { emailVerified: true } }
);
```

### Support Resources

- **Documentation:** See AUTHENTICATION_FIX_SUMMARY.md
- **Backend API:** http://localhost:5000/api
- **Frontend:** http://localhost:5173
- **MongoDB:** https://cloud.mongodb.com
- **Firebase:** https://console.firebase.google.com
- **Render:** https://render.com

---

## Success Criteria

Your authentication system is working correctly when:

✅ Users can sign up with email/password
✅ Users receive OTP emails within 1 minute
✅ Users can verify email with OTP
✅ Users can login after verification
✅ Unverified users cannot login
✅ Users can sign in with Google
✅ Google users are auto-verified
✅ Tokens are generated and stored
✅ Protected routes require authentication
✅ Token refresh works correctly
✅ CORS allows frontend access
✅ Error messages are clear and helpful
✅ All flows work in production

---

**Congratulations!** 🎉 Your authentication system is now fully functional!
