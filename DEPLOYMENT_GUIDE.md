# Deployment Guide - Aurikrex Academy Authentication System

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Firebase project created
- Titan Mail (or other SMTP) account
- Domain name (for production)
- Hosting platform account (Firebase Hosting, Vercel, AWS, etc.)

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `aurikrex-academy`
4. Enable Google Analytics (optional)
5. Create project

### 1.2 Enable Authentication Providers
1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. Enable **Google** provider
   - Add your domain to authorized domains
   - Configure OAuth consent screen

### 1.3 Create Firestore Database
1. Go to **Firestore Database**
2. Click "Create database"
3. Start in **production mode** (we'll add security rules later)
4. Choose a location (e.g., us-central1)

### 1.4 Generate Service Account Key
1. Go to **Project Settings** > **Service Accounts**
2. Click "Generate new private key"
3. Download JSON file (keep it secure!)
4. Extract values for backend .env:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

### 1.5 Get Web App Config
1. In **Project Settings** > **General**
2. Scroll to "Your apps"
3. Click "Add app" > Web
4. Register app with nickname (e.g., "Aurikrex Web")
5. Copy config values for frontend .env:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`

## Step 2: Email Service Setup (Titan Mail)

### 2.1 Configure Titan Mail
1. Log in to your Titan Mail account
2. Go to Settings > Security
3. Enable "Allow access for less secure apps" (or generate app-specific password)
4. Note your email credentials

### 2.2 Test SMTP Connection
```bash
# Create a test script: test-email.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.titan.email',
  port: 465,
  secure: true,
  auth: {
    user: 'info@aurikrex.tech',
    pass: 'YOUR_PASSWORD'
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Error:', error);
  } else {
    console.log('✅ SMTP connection successful');
  }
});

# Run test
node test-email.js
```

## Step 3: Backend Deployment

### 3.1 Create Production .env File
```bash
# Navigate to backend
cd aurikrex-backend

# Create .env file
cp .env.example .env

# Edit with your values
nano .env
```

**Required variables:**
```bash
# Server
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com

# Firebase Admin SDK
FIREBASE_PROJECT_ID=aurikrex-academy
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@aurikrex-academy.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://aurikrex-academy.firebaseio.com
FIREBASE_STORAGE_BUCKET=aurikrex-academy.appspot.com

# Email Configuration
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=info@aurikrex.tech
EMAIL_PASS=your-actual-password

# AI Services (if used)
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=logs/server.log
```

### 3.2 Build Backend
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Test build
node dist/server.js
```

### 3.3 Deploy to Hosting Platform

#### Option A: Firebase Functions (Recommended)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize Functions
firebase init functions
# - Choose existing project
# - Select TypeScript
# - Install dependencies

# Copy your code to functions/src
cp -r src/* functions/src/

# Deploy
firebase deploy --only functions
```

#### Option B: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

#### Option C: AWS EC2 / DigitalOcean
```bash
# SSH into server
ssh user@your-server-ip

# Clone repository
git clone https://github.com/komfalcon/aurikrex-academy.git
cd aurikrex-academy/aurikrex-backend

# Install dependencies
npm install

# Set up PM2 for process management
npm install -g pm2
npm run build
pm2 start dist/server.js --name aurikrex-backend

# Set up nginx reverse proxy (optional)
sudo nano /etc/nginx/sites-available/aurikrex-backend

# Add configuration:
server {
    listen 80;
    server_name api.aurikrex.tech;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site and restart nginx
sudo ln -s /etc/nginx/sites-available/aurikrex-backend /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# Set up SSL with Let's Encrypt
sudo certbot --nginx -d api.aurikrex.tech
```

## Step 4: Firestore Security Rules

Deploy these security rules to Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // OTP verification documents
    match /otpVerifications/{email} {
      // Allow authenticated users to read/write their own OTP
      allow read, write: if true; // Public for now, as user isn't authenticated yet during signup
    }
    
    // User documents
    match /users/{userId} {
      // Allow users to read their own data
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Allow users to update their own data (except sensitive fields)
      allow update: if request.auth != null 
                    && request.auth.uid == userId
                    && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['uid', 'emailVerified', 'verificationMethod']);
      
      // Allow system to create/update users (via backend with admin SDK)
      allow create, write: if true; // Backend uses admin SDK which bypasses rules
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

## Step 5: Frontend Deployment

### 5.1 Create Production .env File
```bash
# Navigate to frontend
cd aurikrex-frontend

# Create .env file
cp .env.example .env

# Edit with your values
nano .env
```

**Required variables:**
```bash
# Firebase Client SDK
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=aurikrex-academy.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=aurikrex-academy
VITE_FIREBASE_STORAGE_BUCKET=aurikrex-academy.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Backend API URL
VITE_API_URL=https://api.aurikrex.tech/api
```

### 5.2 Build Frontend
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test build locally
npm run preview
```

### 5.3 Deploy to Hosting Platform

#### Option A: Firebase Hosting (Recommended)
```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Initialize Hosting
firebase init hosting
# - Choose existing project
# - Set public directory: dist
# - Configure as single-page app: Yes
# - Don't overwrite index.html

# Deploy
firebase deploy --only hosting

# Your app will be at: https://aurikrex-academy.web.app
```

#### Option B: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Vercel will auto-detect Vite and configure correctly
# Set environment variables in Vercel dashboard
```

#### Option C: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod

# Configure:
# - Build command: npm run build
# - Publish directory: dist
# - Set environment variables in Netlify dashboard
```

## Step 6: Post-Deployment Configuration

### 6.1 Update CORS in Backend
Update `CORS_ORIGIN` in backend .env to match your frontend URL:
```bash
CORS_ORIGIN=https://aurikrex-academy.web.app
```

### 6.2 Test Email Delivery
1. Sign up with a test account
2. Check if OTP email is received
3. Verify OTP works
4. Test resend functionality

### 6.3 Test Authentication Flow
- [ ] Email signup with OTP verification
- [ ] Email login (verified users only)
- [ ] Email login rejection (unverified users)
- [ ] Google sign-in
- [ ] Dashboard access
- [ ] Logout

### 6.4 Monitor Logs
```bash
# Backend logs (if using PM2)
pm2 logs aurikrex-backend

# Firebase Functions logs
firebase functions:log

# Check for errors in:
# - Email sending
# - OTP verification
# - Authentication
```

## Step 7: DNS & SSL Configuration

### 7.1 Configure Custom Domain (Optional)
```bash
# For frontend (Firebase Hosting)
firebase hosting:channel:deploy production --domain aurikrex.tech

# For backend (if using custom server)
# Point A record to server IP:
aurikrex.tech -> Your-Server-IP
api.aurikrex.tech -> Your-Server-IP
```

### 7.2 Set up SSL
- **Firebase Hosting**: Automatic SSL
- **Vercel/Netlify**: Automatic SSL
- **Custom Server**: Use Let's Encrypt (see Step 3.3 Option C)

## Step 8: Monitoring & Maintenance

### 8.1 Set up Monitoring
- **Firebase Console**: Monitor auth usage, errors
- **Backend**: Winston logs to file/cloud
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry (optional)

### 8.2 Backup Strategy
- **Firestore**: Enable daily backups
- **Environment Variables**: Store securely (1Password, AWS Secrets Manager)
- **Code**: Push to private GitHub repository

### 8.3 Regular Maintenance
- [ ] Update npm dependencies monthly
- [ ] Run security audits: `npm audit`
- [ ] Review Firebase usage and costs
- [ ] Check email delivery logs
- [ ] Monitor OTP expiry and cleanup

## Troubleshooting

### Issue: OTP Email Not Received
**Solution:**
1. Check email service logs: `emailService.verifyConnection()`
2. Verify SMTP credentials in .env
3. Check spam/junk folder
4. Test with different email provider

### Issue: CORS Error on API Calls
**Solution:**
1. Update `CORS_ORIGIN` in backend .env
2. Ensure frontend URL matches exactly (http vs https)
3. Restart backend server

### Issue: Firebase Auth Error
**Solution:**
1. Verify Firebase config in frontend .env
2. Check Firebase Console > Authentication for enabled providers
3. Ensure domain is authorized in Firebase Console

### Issue: Build Fails
**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Rollback Plan

If deployment fails:
```bash
# Frontend (Firebase Hosting)
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live

# Backend (PM2)
pm2 stop aurikrex-backend
git checkout previous-version-tag
npm install
npm run build
pm2 restart aurikrex-backend

# Or rollback via hosting platform UI
```

## Production Checklist

Before going live:
- [ ] All environment variables set correctly
- [ ] Firebase security rules deployed
- [ ] Email service tested and working
- [ ] SSL/HTTPS enabled
- [ ] CORS configured for production domain
- [ ] Error monitoring set up
- [ ] Backup strategy in place
- [ ] Privacy policy updated
- [ ] Terms of service created
- [ ] Test all authentication flows
- [ ] Monitor logs for errors
- [ ] Set up alerting for critical failures

## Support

For deployment issues:
- **Email**: info@aurikrex.tech
- **Documentation**: See AUTH_DOCUMENTATION.md
- **Security**: See SECURITY_SUMMARY.md

---

**Last Updated**: 2025-11-09
**Version**: 1.0.0
