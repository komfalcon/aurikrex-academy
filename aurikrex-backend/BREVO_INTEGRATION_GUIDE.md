# Brevo Email Integration Guide

## Overview

This guide explains the Brevo (formerly Sendinblue) email integration for OTP (One-Time Password) verification in the Aurikrex Academy backend.

## What Changed

### 1. Replaced Nodemailer with Brevo SDK

**Before:**
- Used Nodemailer with SMTP configuration
- Required EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS

**After:**
- Uses Brevo Transactional Email API
- Requires only BREVO_API_KEY and BREVO_SENDER_EMAIL

### 2. Updated Dependencies

Added `@getbrevo/brevo` package (v3.0.1) to handle all email operations.

```bash
npm install @getbrevo/brevo --save
```

### 3. Environment Variables

#### Required Variables for Render:

```env
BREVO_API_KEY=your_actual_brevo_api_key_here
BREVO_SENDER_EMAIL=info@aurikrex.tech
BREVO_SENDER_NAME=Aurikrex Academy
```

#### How to Get Your Brevo API Key:

1. Log in to your Brevo account: https://app.brevo.com/
2. Navigate to: **Settings** → **SMTP & API** → **API Keys**
3. Click **Generate a new API key**
4. Copy the key (it starts with `xkeysib-`)
5. Add it to your Render environment variables

### 4. New API Endpoint

Added `/api/auth/send-otp` endpoint for explicit OTP sending:

```bash
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 5. Updated Endpoints

The following endpoints are now available:

1. **POST /api/auth/signup** - Creates user and automatically sends OTP
2. **POST /api/auth/send-otp** - Sends OTP to existing user
3. **POST /api/auth/verify-otp** - Verifies the OTP code
4. **POST /api/auth/resend-otp** - Resends OTP (alias for send-otp)

## Configuration Steps

### For Local Development:

1. Create a `.env` file in `aurikrex-backend/`:
   ```env
   BREVO_API_KEY=your_brevo_api_key_here
   BREVO_SENDER_EMAIL=info@aurikrex.tech
   BREVO_SENDER_NAME=Aurikrex Academy
   ```

2. **Never commit the `.env` file** - it's already in `.gitignore`

### For Render Deployment:

1. Go to your Render dashboard
2. Select your backend service
3. Navigate to **Environment** tab
4. Add the following environment variables:
   - `BREVO_API_KEY`: Your actual Brevo API key
   - `BREVO_SENDER_EMAIL`: `info@aurikrex.tech`
   - `BREVO_SENDER_NAME`: `Aurikrex Academy`

4. Click **Save Changes**
5. Render will automatically redeploy with the new configuration

## Testing the Integration

### Option 1: Using the Test Script

```bash
cd aurikrex-backend
npm run build
node dist/test-email.js
```

This will:
- Verify the Brevo API connection
- Send a test email to your sender email address
- Display success/error messages

### Option 2: Testing via API

1. **Test Signup Flow:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "Test",
       "lastName": "User",
       "email": "test@example.com",
       "password": "SecurePass123!"
     }'
   ```

2. **Test Send OTP:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/send-otp \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com"
     }'
   ```

3. **Test Verify OTP:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "otp": "123456"
     }'
   ```

## Security Notes

### ✅ What We Did Right:

1. **No Hardcoded Keys:** All API keys are loaded from environment variables
2. **Environment-Based Configuration:** Uses `process.env` for all sensitive data
3. **Proper Error Handling:** Logs errors without exposing sensitive information
4. **Input Validation:** All endpoints validate email format and OTP length
5. **Secure Transmission:** Uses HTTPS for all API calls to Brevo

### 🔐 Important Security Reminders:

1. **Never commit `.env` files** to Git
2. **Never share API keys** in chat, Discord, or public forums
3. **Use different API keys** for development and production
4. **Rotate API keys regularly** (every 90 days recommended)
5. **Monitor Brevo dashboard** for suspicious activity

## Troubleshooting

### Issue: "BREVO_API_KEY is not configured"

**Solution:** 
- Verify the environment variable is set in Render
- Check that the variable name is exactly `BREVO_API_KEY` (case-sensitive)
- Restart the Render service after adding environment variables

### Issue: "Failed to send verification email"

**Solutions:**
1. Check that your Brevo account is active and has email credits
2. Verify the sender email (`info@aurikrex.tech`) is verified in Brevo
3. Check Brevo's dashboard for error logs
4. Ensure your API key has the correct permissions (Transactional emails)

### Issue: "Email not received"

**Solutions:**
1. Check spam/junk folder
2. Verify the recipient email is valid
3. Check Brevo's dashboard for delivery status
4. Ensure sender domain is properly configured in Brevo

## Features

### OTP Email Template

The OTP email includes:
- Professional design with Aurikrex Academy branding
- Clear display of the 6-digit OTP code
- 10-minute expiration notice
- Security warning about not sharing the code
- Responsive design that works on all devices

### Email Flow

1. **User Signs Up** → OTP email sent automatically
2. **User Can Request New OTP** → Via `/send-otp` or `/resend-otp`
3. **User Verifies OTP** → Account is activated
4. **OTP Expires** → After 10 minutes, user must request a new one

## API Response Examples

### Success Response (Send OTP):
```json
{
  "success": true,
  "message": "Verification code sent successfully"
}
```

### Success Response (Verify OTP):
```json
{
  "success": true,
  "message": "Email verified successfully",
  "redirect": "https://aurikrex.tech/dashboard",
  "data": {
    "uid": "user123",
    "email": "user@example.com",
    "emailVerified": true,
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Failed to send verification code. Please try again.",
  "error": "Error details here"
}
```

## Production Checklist

- [ ] Brevo account is active with sufficient email credits
- [ ] Sender email (`info@aurikrex.tech`) is verified in Brevo
- [ ] BREVO_API_KEY is added to Render environment variables
- [ ] BREVO_SENDER_EMAIL is added to Render environment variables
- [ ] BREVO_SENDER_NAME is added to Render environment variables
- [ ] Test email sending works in production
- [ ] OTP verification flow works end-to-end
- [ ] Email delivery is monitored in Brevo dashboard
- [ ] Error logging is set up and monitored

## Support

For issues related to:
- **Brevo API:** Check [Brevo Documentation](https://developers.brevo.com/)
- **Backend Issues:** Contact the development team
- **Email Delivery:** Check Brevo dashboard and logs

## Additional Resources

- [Brevo Transactional Email API Documentation](https://developers.brevo.com/docs/send-a-transactional-email)
- [Brevo Node.js SDK on npm](https://www.npmjs.com/package/@getbrevo/brevo)
- [Brevo Dashboard](https://app.brevo.com/)
