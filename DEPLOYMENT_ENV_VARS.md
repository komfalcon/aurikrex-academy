# Environment Variables Configuration Guide

This document outlines all required environment variables for deploying Aurikrex Academy to production.

## 🚀 Production Deployment URLs

- **Backend (Render)**: `https://aurikrex-backend.onrender.com`
- **Frontend (Vercel)**: `https://aurikrex.tech`
- **Database**: MongoDB Atlas

---

## 🔧 Backend Environment Variables (Render)

### Server Configuration
```env
PORT=5000
NODE_ENV=production
HOST=0.0.0.0
```

### CORS & Security
```env
ALLOWED_ORIGINS=https://aurikrex.tech,https://www.aurikrex.tech,https://aurikrex-backend.onrender.com
JWT_SECRET=<your-super-secret-jwt-key-min-32-characters>
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d
```

### MongoDB Atlas
```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/aurikrex-academy?retryWrites=true&w=majority
MONGO_DB_NAME=aurikrex-academy
```

### Google OAuth
```env
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_CALLBACK_URL=https://aurikrex-backend.onrender.com/api/auth/google/callback
```

### Frontend URL
```env
FRONTEND_URL=https://aurikrex.tech
BACKEND_URL=https://aurikrex-backend.onrender.com
```

### AI Services
```env
OPENAI_API_KEY=sk-<your-openai-api-key>
GEMINI_API_KEY=<your-gemini-api-key>
CLAUDE_API_KEY=sk-ant-<your-claude-api-key>
```

### Email Configuration
```env
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=<your-email@yourdomain.com>
EMAIL_PASS=<your-email-password>
```

### Rate Limiting (Optional)
```env
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### Redis (Optional - for caching)
```env
REDIS_URL=<redis-connection-url>
```

---

## 🌐 Frontend Environment Variables (Vercel)

### Backend API
```env
VITE_API_URL=https://aurikrex-backend.onrender.com/api
```

### JWT Secret (for validation)
```env
VITE_JWT_SECRET=<same-as-backend-jwt-secret>
```

### Application Configuration
```env
VITE_APP_NAME=AurikrexAcademy
VITE_FRONTEND_URL=https://aurikrex.tech
```

---

## 📋 Deployment Checklist

### Render Backend Setup
1. ✅ Set all backend environment variables in Render dashboard
2. ✅ Ensure build command: `npm run build`
3. ✅ Ensure start command: `npm start`
4. ✅ Set Node version to 18 or higher
5. ✅ Enable auto-deploy from main branch
6. ✅ Verify MongoDB Atlas IP whitelist includes Render IPs (or use 0.0.0.0/0)

### Vercel Frontend Setup
1. ✅ Set all frontend environment variables in Vercel dashboard
2. ✅ Ensure build command: `npm run build`
3. ✅ Ensure output directory: `dist`
4. ✅ Set Node version to 18 or higher
5. ✅ Enable auto-deploy from main branch

### Google OAuth Configuration
1. ✅ Go to [Google Cloud Console](https://console.cloud.google.com)
2. ✅ Create OAuth 2.0 Client ID
3. ✅ Add authorized redirect URIs:
   - `https://aurikrex-backend.onrender.com/api/auth/google/callback`
4. ✅ Add authorized JavaScript origins:
   - `https://aurikrex.tech`
   - `https://www.aurikrex.tech`
5. ✅ Copy Client ID and Client Secret to Render environment variables

### MongoDB Atlas Configuration
1. ✅ Create cluster on MongoDB Atlas
2. ✅ Create database user with read/write access
3. ✅ Whitelist Render IP addresses (or use 0.0.0.0/0 for all IPs)
4. ✅ Get connection string and add to Render environment variables
5. ✅ Verify database name is `aurikrex-academy`

---

## 🔐 Security Notes

### Critical Security Settings
- **JWT_SECRET**: Must be at least 32 characters long, random and secure
- **MongoDB credentials**: Never commit to version control
- **Google OAuth secrets**: Keep private, never expose in frontend code
- **Email passwords**: Use app-specific passwords when possible
- **CORS origins**: Only include trusted domains

### Production Security Checklist
- [x] All localhost references removed from code
- [x] Environment variables properly configured
- [x] CORS restricted to production domains
- [x] JWT tokens properly secured
- [x] HTTPS enforced for all connections
- [x] Rate limiting enabled
- [x] Input validation on all endpoints
- [x] MongoDB connection secured with authentication

---

## 🧪 Testing Production Deployment

### Backend Health Check
```bash
curl https://aurikrex-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-21T...",
  "environment": "production",
  "services": {
    "database": "connected",
    "databaseLatency": "50ms"
  }
}
```

### Frontend Connectivity
1. Visit `https://aurikrex.tech`
2. Open browser console
3. Check for API connection errors
4. Test signup flow
5. Test login flow
6. Test Google OAuth flow

### API Endpoints to Test
- `POST /api/auth/signup` - Email signup
- `POST /api/auth/login` - Email login
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/resend-otp` - Resend OTP
- `GET /api/auth/google/url` - Get Google OAuth URL
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/me` - Get current user (requires JWT)

---

## 🆘 Troubleshooting

### Backend won't start
- Check all required environment variables are set
- Verify MongoDB connection string is correct
- Check MongoDB Atlas IP whitelist
- Review Render logs for errors

### Google OAuth not working
- Verify Google OAuth Client ID and Secret
- Check redirect URI matches exactly: `https://aurikrex-backend.onrender.com/api/auth/google/callback`
- Ensure authorized origins include frontend domain
- Check that credentials haven't expired

### Email OTP not sending
- Verify EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
- Check email service provider settings
- Enable "less secure apps" or use app-specific password
- Review backend logs for SMTP errors

### CORS errors
- Verify ALLOWED_ORIGINS includes frontend domain
- Check that frontend is using correct backend URL
- Ensure credentials: true is set in CORS config
- Review browser console for specific CORS error

### MongoDB connection failed
- Verify MONGO_URI is correct
- Check MongoDB Atlas IP whitelist
- Ensure database user has correct permissions
- Verify network access in MongoDB Atlas dashboard

---

## 📞 Support

For deployment issues:
1. Check this documentation
2. Review application logs (Render/Vercel dashboards)
3. Verify all environment variables
4. Test API endpoints individually
5. Check third-party service status (MongoDB, Google OAuth, Email)

---

**Last Updated**: November 21, 2025
**Production Status**: ✅ Ready for Deployment
