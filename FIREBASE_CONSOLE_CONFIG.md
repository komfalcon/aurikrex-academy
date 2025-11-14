# Firebase Console Configuration Guide

## Quick Reference for Fixing Authentication Issues

This guide provides step-by-step instructions for configuring Firebase Console and Google Cloud Console to fix authentication issues on deployed environments.

---

## Part 1: Firebase Console Configuration

### Step 1: Add Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **aurikrex-academy1**
3. Navigate to **Authentication** (in left sidebar)
4. Click on **Settings** tab
5. Scroll to **Authorized domains** section
6. You should see these domains listed:
   - `localhost` (default)
   - `aurikrex-academy1.firebaseapp.com` (default)

7. Click **Add domain** and add the following if not present:
   - `aurikrex-academy12.web.app`
   - `aurikrex-academy12.firebaseapp.com`
   - `aurikrex.tech`

8. Click **Add** for each domain

**Screenshot reference**: You should see all domains listed without any warning icons.

### Step 2: Enable and Configure Google Sign-In

1. Still in **Authentication** section
2. Click on **Sign-in method** tab
3. Find **Google** in the list of providers
4. Click on **Google** row to expand settings

**If Google is disabled:**
5. Click **Enable**
6. Enter **Project support email** (required): `info@aurikrex.tech`
7. Click **Save**

**If Google is already enabled:**
5. Verify **Project support email** is set
6. Note the **Web SDK configuration** section (you'll need this for next step)
7. Click **Save** if you made any changes

---

## Part 2: Google Cloud Console OAuth Configuration

### Why This Is Needed
Firebase Auth uses Google OAuth behind the scenes. For Google Sign-In to work on custom domains and Firebase Hosting, you must whitelist those domains in Google Cloud Console.

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Ensure you're logged in with the same account as Firebase
3. Select your project from the dropdown at the top
   - Project name: **aurikrex-academy1** or similar
   - It should be the same project as your Firebase project

### Step 2: Navigate to OAuth Credentials

1. In the left sidebar, click **APIs & Services**
2. Click **Credentials**
3. You'll see a list of credentials

### Step 3: Find and Edit OAuth 2.0 Client ID

1. Look for an **OAuth 2.0 Client ID** in the list
   - It might be named "Web client (auto created by Google Service)"
   - Or it might have a custom name
   - Type should be "Web application"

2. Click on the **name** of the OAuth client to edit it

### Step 4: Add Authorized JavaScript Origins

In the **Authorized JavaScript origins** section:

1. Click **+ ADD URI**
2. Add each of these origins one by one:

```
http://localhost:5173
https://aurikrex-academy12.web.app
https://aurikrex-academy12.firebaseapp.com
https://aurikrex.tech
```

**Important Notes**:
- Do NOT include trailing slashes
- Use exact protocol (`http://` for localhost, `https://` for production)
- Each origin must be on a separate line

### Step 5: Add Authorized Redirect URIs

In the **Authorized redirect URIs** section:

1. Click **+ ADD URI**
2. Add each of these redirect URIs one by one:

```
http://localhost:5173/__/auth/handler
https://aurikrex-academy12.web.app/__/auth/handler
https://aurikrex-academy12.firebaseapp.com/__/auth/handler
https://aurikrex.tech/__/auth/handler
```

**Important Notes**:
- The `/__/auth/handler` path is required - this is Firebase's OAuth callback URL
- Each URI must match exactly
- Do NOT add trailing slashes

### Step 6: Save Changes

1. Scroll to bottom
2. Click **SAVE**
3. You should see a success message
4. **IMPORTANT**: Changes may take 5-10 minutes to propagate

---

## Part 3: Verify Configuration

### In Firebase Console

1. Go back to Firebase Console → Authentication → Settings → Authorized domains
2. Verify all your domains are listed
3. None should have warning/error icons

### In Google Cloud Console

1. Go back to the OAuth client you edited
2. Verify all JavaScript origins are listed
3. Verify all redirect URIs are listed
4. Check for any error messages

---

## Part 4: Test Authentication

### Wait for Propagation
- Wait at least 5 minutes after saving changes
- Changes to OAuth can take up to 10 minutes to propagate globally

### Clear Browser Cache
```
1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
```

Or use Incognito/Private mode for testing.

### Test Each Domain

#### Test on aurikrex-academy12.web.app
1. Navigate to `https://aurikrex-academy12.web.app`
2. Click "Sign in with Google"
3. Select a Google account
4. Should redirect to dashboard without errors

#### Test on aurikrex.tech
1. Navigate to `https://aurikrex.tech`
2. Click "Sign in with Google"
3. Select a Google account
4. Should redirect to dashboard without errors

---

## Common Issues and Solutions

### Issue: "Not allowed by CORS"

**Cause**: Domain not added to authorized origins

**Solution**: 
1. Double-check authorized JavaScript origins in Google Cloud Console
2. Ensure exact domain (no typos, correct protocol)
3. Wait 10 minutes and try again

### Issue: "redirect_uri_mismatch"

**Cause**: Redirect URI not configured correctly

**Solution**:
1. Check authorized redirect URIs in Google Cloud Console
2. Ensure they end with `/__/auth/handler`
3. Verify no trailing slashes
4. Wait 10 minutes and try again

### Issue: "Popup blocked"

**Cause**: Browser is blocking the Google Sign-In popup

**Solution**:
1. Check browser address bar for popup blocker icon
2. Allow popups for the domain
3. Try again

### Issue: "This app isn't verified"

**Cause**: OAuth consent screen not configured or app in testing mode

**Solution**:
1. This is normal for apps in development
2. Click "Advanced" → "Go to [app name] (unsafe)"
3. For production, verify your app in Google Cloud Console

### Issue: Authentication works on one domain but not another

**Cause**: One domain might be missing from configuration

**Solution**:
1. Verify ALL domains are in both Firebase authorized domains AND Google Cloud OAuth origins
2. Verify ALL redirect URIs are configured
3. Clear browser cache specific to the problematic domain
4. Wait 10 minutes after making changes

---

## Configuration Checklist

Use this to verify everything is set up correctly:

### Firebase Console
- [ ] Project: aurikrex-academy1 selected
- [ ] Authentication → Settings → Authorized domains:
  - [ ] `localhost`
  - [ ] `aurikrex-academy12.web.app`
  - [ ] `aurikrex-academy12.firebaseapp.com`
  - [ ] `aurikrex.tech`
- [ ] Authentication → Sign-in method → Google: Enabled
- [ ] Email/Password provider: Enabled (if using email auth)

### Google Cloud Console
- [ ] Project: aurikrex-academy1 (or matching Firebase project)
- [ ] APIs & Services → Credentials → OAuth 2.0 Client ID:
  - [ ] Authorized JavaScript origins:
    - [ ] `http://localhost:5173`
    - [ ] `https://aurikrex-academy12.web.app`
    - [ ] `https://aurikrex-academy12.firebaseapp.com`
    - [ ] `https://aurikrex.tech`
  - [ ] Authorized redirect URIs:
    - [ ] `http://localhost:5173/__/auth/handler`
    - [ ] `https://aurikrex-academy12.web.app/__/auth/handler`
    - [ ] `https://aurikrex-academy12.firebaseapp.com/__/auth/handler`
    - [ ] `https://aurikrex.tech/__/auth/handler`

### Testing
- [ ] Waited 10 minutes after configuration changes
- [ ] Cleared browser cache
- [ ] Tested Google Sign-In on all domains
- [ ] No errors in browser console
- [ ] Successfully redirected to dashboard

---

## Visual Reference

### Expected Firebase Authorized Domains View
```
Authorized domains
Domains that can access Firebase Authentication features.

localhost
aurikrex-academy12.web.app
aurikrex-academy12.firebaseapp.com
aurikrex.tech
+ Add domain
```

### Expected Google Cloud OAuth Configuration View
```
Authorized JavaScript origins
URIs: 4
http://localhost:5173
https://aurikrex-academy12.web.app
https://aurikrex-academy12.firebaseapp.com
https://aurikrex.tech

Authorized redirect URIs
URIs: 4
http://localhost:5173/__/auth/handler
https://aurikrex-academy12.web.app/__/auth/handler
https://aurikrex-academy12.firebaseapp.com/__/auth/handler
https://aurikrex.tech/__/auth/handler
```

---

## Need Help?

If you've followed all steps and authentication still doesn't work:

1. **Check Firebase Console Logs**:
   - Functions → Logs
   - Look for errors related to authentication

2. **Check Browser Console**:
   - Press F12
   - Go to Console tab
   - Look for error messages (especially Firebase Auth errors)

3. **Test with curl**:
   ```bash
   curl https://us-central1-aurikrex-academy1.cloudfunctions.net/api/health
   ```
   Should return: `{"status":"ok",...}`

4. **Verify DNS** (for custom domain):
   ```bash
   nslookup aurikrex.tech
   ```
   Should return Firebase Hosting IPs

5. **Check SSL** (for custom domain):
   - Visit `https://aurikrex.tech`
   - Click padlock icon
   - Verify certificate is valid and issued by Google

---

**Last Updated**: November 2024  
**Important**: Always wait 5-10 minutes after making OAuth changes before testing.
