# Google OAuth Setup Guide

This guide explains how to configure Google OAuth for the Aurikrex Academy project.

## Prerequisites

- Google Cloud Console account
- Access to the Aurikrex Academy backend on Render
- Access to the Aurikrex Academy frontend on Vercel

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: `Aurikrex Academy`
5. Click "Create"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on "Google+ API"
4. Click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace organization)
3. Click "Create"

### App Information:
- **App name**: Aurikrex Academy
- **User support email**: info@aurikrex.tech (or your email)
- **App logo**: (Optional) Upload your app logo
- **Application home page**: https://aurikrex.tech
- **Application privacy policy link**: https://aurikrex.tech/privacy (create if needed)
- **Application terms of service link**: https://aurikrex.tech/terms (create if needed)
- **Authorized domains**: 
  - aurikrex.tech
  - aurikrex-backend.onrender.com

### Developer Contact Information:
- **Email addresses**: info@aurikrex.tech

4. Click "Save and Continue"

### Scopes:
5. Click "Add or Remove Scopes"
6. Select the following scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
7. Click "Update"
8. Click "Save and Continue"

### Test Users (Optional):
9. Add test users if you want to test before publishing
10. Click "Save and Continue"

### Summary:
11. Review your settings
12. Click "Back to Dashboard"

## Step 4: Create OAuth 2.0 Client ID

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"

### Configuration:

**Name**: Aurikrex Academy Web Client

**Authorized JavaScript origins**:
```
https://aurikrex.tech
http://localhost:8080
```

**Authorized redirect URIs**:
```
https://aurikrex-backend.onrender.com/api/auth/google/callback
http://localhost:5000/api/auth/google/callback
```

4. Click "Create"
5. **IMPORTANT**: Copy your Client ID and Client Secret - you'll need these!

## Step 5: Configure Backend Environment Variables (Render)

1. Go to your Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Add the following environment variables:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://aurikrex-backend.onrender.com/api/auth/google/callback
FRONTEND_URL=https://aurikrex.tech
```

5. Click "Save Changes"
6. Wait for the backend to redeploy

## Step 6: Configure Frontend Environment Variables (Vercel)

The frontend doesn't need special Google OAuth variables since it uses the backend API. Just make sure these are set:

1. Go to your Vercel dashboard
2. Select your frontend project
3. Go to "Settings" > "Environment Variables"
4. Verify/Add:

```bash
VITE_API_URL=https://aurikrex-backend.onrender.com/api
VITE_FRONTEND_URL=https://aurikrex.tech
```

5. Click "Save"
6. Redeploy if needed

## Step 7: Test Google OAuth Flow

### Local Testing (Optional):

1. Update your local `.env` files with the credentials
2. Start backend: `cd aurikrex-backend && npm run dev`
3. Start frontend: `cd aurikrex-frontend && npm run dev`
4. Navigate to `http://localhost:8080/signup`
5. Click "Sign up with Google"
6. Complete the OAuth flow

### Production Testing:

1. Navigate to `https://aurikrex.tech/signup`
2. Click "Sign up with Google"
3. You should be redirected to Google's authorization page
4. Select your Google account
5. Grant permissions
6. You should be redirected back to `https://aurikrex.tech/auth/callback`
7. After processing, you should land on the dashboard

## Troubleshooting

### "redirect_uri_mismatch" Error
- **Cause**: The redirect URI doesn't match what's configured in Google Cloud Console
- **Solution**: Double-check the authorized redirect URIs in Step 4
- **Note**: The URI must match EXACTLY (including http/https, trailing slashes, etc.)

### "invalid_client" Error
- **Cause**: Client ID or Client Secret is incorrect
- **Solution**: Verify the environment variables in Render match what's in Google Cloud Console

### "access_denied" Error
- **Cause**: User canceled the authorization or permissions were denied
- **Solution**: This is normal user behavior, no action needed

### OAuth Consent Screen Shows Warning
- **Cause**: App is not verified by Google
- **Solution**: 
  - For testing: Click "Advanced" > "Go to Aurikrex Academy (unsafe)"
  - For production: Submit app for verification (required if >100 users)

### User Gets "Error 400: invalid_request"
- **Cause**: Missing required scopes or incorrect OAuth configuration
- **Solution**: Verify scopes in Step 3 are correctly set

### Callback Never Happens
- **Cause**: CORS or network issues
- **Solution**: 
  - Check browser console for errors
  - Verify CORS settings in backend allow frontend domain
  - Check backend logs on Render

## Publishing the App (Optional - For >100 Users)

If you expect more than 100 users, you'll need to verify your app:

1. Go to "OAuth consent screen" in Google Cloud Console
2. Click "Publish App"
3. Follow the verification process
4. This may take several days to weeks

## Security Best Practices

1. **Never commit credentials**: Keep Client ID and Client Secret in environment variables only
2. **Use HTTPS in production**: Always use HTTPS for redirect URIs
3. **Limit authorized domains**: Only add domains you control
4. **Monitor usage**: Check Google Cloud Console for unusual activity
5. **Rotate secrets**: Periodically regenerate Client Secret for security

## Support

For issues:
- Check Render logs: `https://dashboard.render.com/`
- Check browser console for errors
- Verify all environment variables are set correctly
- Test OAuth flow in incognito mode to avoid cached credentials

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google OAuth Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
- [Render Environment Variables](https://render.com/docs/configure-environment-variables)
