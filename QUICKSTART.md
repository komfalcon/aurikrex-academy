# Firebase Authentication Fix - Quick Start Guide

## 🎯 Problem

Authentication fails on deployed Firebase Hosting and custom domains:
- **Google Sign-In**: "Failed to sign in with Google. Please try again"
- **Email/Password**: "Network error. Please check your connection and try again"

## ✅ Solution Overview

This fix involves:
1. **Code Changes** (already done in this PR) ✓
2. **Firebase Console Configuration** (you need to do) ⏰ 15 minutes
3. **Deployment** (automated script available) ⏰ 5 minutes

## 🚀 Quick Start (After Merging This PR)

### Step 1: Verify Configuration (2 minutes)

```bash
# Run verification script
./verify-config.sh

# Should show all configuration files present
```

### Step 2: Configure Firebase Console (15 minutes)

#### A. Add Authorized Domains (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **aurikrex-academy1**
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain** and add:
   - `aurikrex-academy12.web.app`
   - `aurikrex-academy12.firebaseapp.com`
   - `aurikrex.tech`
5. Click **Save**

#### B. Configure Google OAuth (10 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **aurikrex-academy1**
3. Navigate to **APIs & Services** → **Credentials**
4. Edit the **OAuth 2.0 Client ID**

**Add Authorized JavaScript origins**:
```
http://localhost:5173
https://aurikrex-academy12.web.app
https://aurikrex-academy12.firebaseapp.com
https://aurikrex.tech
```

**Add Authorized redirect URIs**:
```
http://localhost:5173/__/auth/handler
https://aurikrex-academy12.web.app/__/auth/handler
https://aurikrex-academy12.firebaseapp.com/__/auth/handler
https://aurikrex.tech/__/auth/handler
```

5. Click **Save**
6. **Wait 5-10 minutes** for changes to propagate

📖 **Detailed instructions**: See `FIREBASE_CONSOLE_CONFIG.md`

### Step 3: Setup Production Environment (5 minutes)

#### Option A: Interactive Script (Recommended)

```bash
# Run the setup script
./setup-production.sh

# Follow the prompts to:
# 1. Enter Firebase configuration values
# 2. Configure API URL
# 3. Set Cloud Functions config
# 4. Build and deploy (optional)
```

#### Option B: Manual Setup

**Create frontend `.env`**:
```bash
cd aurikrex-frontend
cat > .env << EOF
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=aurikrex-academy1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=aurikrex-academy1
VITE_FIREBASE_STORAGE_BUCKET=aurikrex-academy1.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_URL=/api
EOF
```

**Set Cloud Functions config**:
```bash
firebase functions:config:set \
  app.allowed_origins="https://aurikrex-academy12.web.app,https://aurikrex-academy12.firebaseapp.com,https://aurikrex.tech"
```

### Step 4: Build and Deploy (5 minutes)

```bash
# Build frontend
cd aurikrex-frontend
npm run build

# Build functions
cd ../functions
npm run build

# Deploy to Firebase
cd ..
firebase deploy

# OR deploy separately
firebase deploy --only functions
firebase deploy --only hosting
```

### Step 5: Test Authentication (10 minutes)

After deployment, test on each domain:

#### Test on Firebase Default Domain
Visit: `https://aurikrex-academy12.web.app`

- [ ] Click "Sign in with Google" → Should work ✓
- [ ] Try email sign-up → Should receive OTP ✓
- [ ] Verify OTP → Should redirect to dashboard ✓
- [ ] Try email login → Should work ✓

#### Test on Custom Domain
Visit: `https://aurikrex.tech`

- [ ] Click "Sign in with Google" → Should work ✓
- [ ] Try email sign-up → Should receive OTP ✓
- [ ] Verify OTP → Should redirect to dashboard ✓
- [ ] Try email login → Should work ✓

✅ **Success**: All tests pass without errors

## 📋 Complete Checklists

### Pre-Deployment Checklist
- [ ] Merged this PR
- [ ] Ran `./verify-config.sh` - all checks pass
- [ ] Added authorized domains in Firebase Console
- [ ] Configured OAuth redirect URIs in Google Cloud Console
- [ ] Waited 10 minutes after OAuth changes
- [ ] Created production `.env` file
- [ ] Set Cloud Functions config
- [ ] Frontend built successfully
- [ ] Functions built successfully

### Post-Deployment Checklist
- [ ] Deployment completed without errors
- [ ] Google Sign-In works on aurikrex-academy12.web.app
- [ ] Google Sign-In works on aurikrex.tech
- [ ] Email/Password works on aurikrex-academy12.web.app
- [ ] Email/Password works on aurikrex.tech
- [ ] No console errors on any domain
- [ ] Dashboard displays user data correctly

## 🔧 Troubleshooting

### Google Sign-In Still Fails

**Check**:
1. All domains added to Firebase authorized domains? ✓
2. All JavaScript origins added to Google Cloud OAuth? ✓
3. All redirect URIs added to Google Cloud OAuth? ✓
4. Waited 10 minutes after OAuth changes? ✓
5. Tested in incognito mode? ✓

**Error: "redirect_uri_mismatch"**
- Check OAuth redirect URIs include `/__/auth/handler`
- Verify exact domain match (no typos)

**Error: "popup blocked"**
- Allow popups in browser settings
- Try different browser

### Email/Password Still Shows Network Error

**Check**:
1. `VITE_API_URL=/api` in production `.env`? ✓
2. `firebase.json` has API rewrite? ✓
3. Functions deployed successfully? ✓

**Test API directly**:
```bash
curl https://us-central1-aurikrex-academy1.cloudfunctions.net/api/health
# Should return: {"status":"ok",...}
```

**Check logs**:
```bash
firebase functions:log --only api
```

## 📚 Documentation

| Document | Purpose | When to Use |
|----------|---------|-------------|
| `FIREBASE_CONSOLE_CONFIG.md` | Step-by-step Console setup | Setting up Firebase & Google Cloud |
| `FIREBASE_AUTH_DEPLOYMENT_GUIDE.md` | Complete deployment guide | Detailed deployment instructions |
| `DEPLOYMENT_CHECKLIST.md` | Verification checklist | Before and after deployment |
| `FIREBASE_AUTH_FIX_SUMMARY.md` | Implementation summary | Understanding the changes |
| `setup-production.sh` | Setup script | Quick production setup |
| `verify-config.sh` | Verification script | Checking configuration |

## 🎯 What This PR Changes

### Configuration Files (Minimal Changes)
- `firebase.json`: Added API rewrite + caching headers
- `functions/src/index.ts`: Enhanced CORS with production domains
- `aurikrex-frontend/.env.example`: Added production examples

### Documentation (1000+ lines)
- Complete deployment guides
- Step-by-step Firebase Console setup
- Automated setup scripts
- Verification tools

### What Stays the Same
✅ No changes to authentication logic  
✅ No changes to security validation  
✅ No changes to database operations  
✅ No breaking changes  

## ⏱️ Time Estimates

| Task | Time | When |
|------|------|------|
| Merge PR | 1 min | Now |
| Configure Firebase Console | 15 min | After merge |
| Setup production environment | 5 min | After Console config |
| Build & deploy | 5 min | After setup |
| Test authentication | 10 min | After deployment |
| **Total** | **~35 minutes** | |

## 🆘 Need Help?

**Quick fixes**:
1. Run `./verify-config.sh` to check configuration
2. See `FIREBASE_CONSOLE_CONFIG.md` for Console setup
3. See `FIREBASE_AUTH_DEPLOYMENT_GUIDE.md` for detailed guide
4. Check `DEPLOYMENT_CHECKLIST.md` for verification

**Still stuck?**
- Check Firebase Console → Functions → Logs
- Check browser console for error codes
- Review Cloud Functions logs: `firebase functions:log`
- Test API health: `curl <api-url>/health`

## ✅ Success Criteria

Authentication is fixed when:
- [ ] Google Sign-In works on all 3 domains (localhost, web.app, custom)
- [ ] Email/Password works on all 3 domains
- [ ] OTP emails are received and verified
- [ ] No console errors
- [ ] Dashboard shows user data correctly
- [ ] No errors in Cloud Functions logs

---

**Ready to start?** Begin with Step 1: `./verify-config.sh`

**Questions?** Check the detailed guides in the repository.

**Last Updated**: November 2024  
**Version**: 1.0
