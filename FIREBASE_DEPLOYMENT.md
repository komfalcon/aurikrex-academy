# Firebase Functions Migration Guide

This document provides comprehensive instructions for deploying and managing the Aurikrex Academy backend on Firebase Cloud Functions.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Local Development](#local-development)
4. [Environment Configuration](#environment-configuration)
5. [Deployment](#deployment)
6. [Testing](#testing)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 20.x or higher
- npm 9.x or higher
- Firebase CLI (`npm install -g firebase-tools`)
- Access to the Firebase project `aurikrex-academy1`

## Initial Setup

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Verify Project Configuration

The repository is already configured with:
- `.firebaserc` - Contains the Firebase project ID
- `firebase.json` - Firebase configuration for hosting and functions
- `functions/` - Cloud Functions source code

## Local Development

### 1. Install Dependencies

Navigate to the functions directory and install dependencies:

```bash
cd functions
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the `functions/` directory based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# Server Configuration
NODE_ENV=development

# Firebase Admin SDK Configuration (for local development)
FIREBASE_PROJECT_ID=aurikrex-academy1
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@aurikrex-academy1.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://aurikrex-academy1.firebaseio.com
FIREBASE_STORAGE_BUCKET=aurikrex-academy1.appspot.com

# AI Service Configuration
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
CLAUDE_API_KEY=your-claude-api-key

# Security
JWT_SECRET=your-secure-jwt-secret-minimum-32-characters

# Email Configuration (Titan Mail SMTP)
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=info@aurikrex.tech
EMAIL_PASS=your-email-password
```

### 3. Build the Functions

```bash
npm run build
```

### 4. Run Firebase Emulators (Optional)

To test functions locally with emulators:

```bash
firebase emulators:start
```

This will start:
- Functions emulator on http://localhost:5001
- Emulator UI on http://localhost:4000

## Environment Configuration

### For Production Deployment

Firebase Functions uses environment configuration instead of `.env` files in production. Set your environment variables using the Firebase CLI:

```bash
# Set OpenAI API Key
firebase functions:config:set openai.api_key="sk-..."

# Set Gemini API Key
firebase functions:config:set gemini.api_key="AIza..."

# Set JWT Secret
firebase functions:config:set jwt.secret="your-secure-jwt-secret"

# Set allowed origins (comma-separated)
firebase functions:config:set app.allowed_origins="https://yourdomain.com,https://app.yourdomain.com"

# Set Email configuration
firebase functions:config:set email.host="smtp.titan.email"
firebase functions:config:set email.port="465"
firebase functions:config:set email.secure="true"
firebase functions:config:set email.user="info@aurikrex.tech"
firebase functions:config:set email.pass="your-email-password"

# Set Redis URL (if using Redis)
firebase functions:config:set redis.url="redis://your-redis-url:6379"
```

To view current configuration:

```bash
firebase functions:config:get
```

To download configuration for local testing:

```bash
firebase functions:config:get > functions/.runtimeconfig.json
```

## Deployment

### 1. Build the Frontend (if applicable)

If you have a frontend in `aurikrex-frontend/`:

```bash
cd aurikrex-frontend
npm install
npm run build
```

### 2. Deploy Functions

From the repository root:

```bash
# Deploy only functions
firebase deploy --only functions

# Deploy functions and hosting
firebase deploy

# Deploy specific function
firebase deploy --only functions:api
```

### 3. Verify Deployment

After deployment, your API will be available at:

```
https://us-central1-aurikrex-academy1.cloudfunctions.net/api
```

With Firebase Hosting rewrites configured in `firebase.json`, the API is also accessible via:

```
https://your-domain.com/api
```

## Testing

### Test API Endpoints

#### Health Check

```bash
curl https://your-domain.com/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2024-11-09T12:00:00.000Z",
  "environment": "production",
  "services": {
    "database": "connected",
    "auth": "connected",
    "storage": "connected"
  },
  "message": "Aurikrex Backend is healthy!"
}
```

#### Test Authentication

```bash
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123",
    "name": "Test User"
  }'
```

### View Function Logs

```bash
# View all function logs
firebase functions:log

# View logs for specific function
firebase functions:log --only api

# Follow logs in real-time
firebase functions:log --only api --follow
```

## Monitoring

### Firebase Console

Monitor your functions in the Firebase Console:

1. Go to https://console.firebase.google.com
2. Select your project
3. Navigate to Functions
4. View metrics, logs, and usage

### Key Metrics to Monitor

- **Invocations**: Number of function calls
- **Execution time**: Function performance
- **Memory usage**: Resource consumption
- **Error rate**: Function failures
- **Active instances**: Concurrent executions

## Troubleshooting

### Common Issues

#### 1. Function Timeout

**Problem**: Function execution exceeds timeout limit (60s default)

**Solution**: Increase timeout in `firebase.json`:

```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs20",
    "timeout": "300s"
  }
}
```

#### 2. Memory Limit Exceeded

**Problem**: Function runs out of memory

**Solution**: Increase memory allocation in function definition:

```typescript
export const api = functions
  .runWith({ memory: "512MB" })
  .https.onRequest(app);
```

#### 3. CORS Issues

**Problem**: Frontend cannot access API due to CORS

**Solution**: Update ALLOWED_ORIGINS in environment config or check CORS middleware in `functions/src/index.ts`

#### 4. Environment Variables Not Available

**Problem**: Functions can't access environment variables

**Solution**: 
- For local development: Ensure `.env` file exists in `functions/` directory
- For production: Set using `firebase functions:config:set`
- Verify with `firebase functions:config:get`

#### 5. Build Errors

**Problem**: TypeScript compilation fails

**Solution**:

```bash
cd functions
npm install
npm run build
```

Check for TypeScript errors in the output.

### Viewing Detailed Logs

```bash
# View last 100 lines
firebase functions:log --lines 100

# View logs for a specific time period
firebase functions:log --since 1h

# Filter by severity
firebase functions:log --severity ERROR
```

## Performance Optimization

### Cold Start Mitigation

1. **Use scheduled functions** to keep instances warm:

```typescript
export const keepWarm = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(() => {
    console.log('Keeping function warm');
    return null;
  });
```

2. **Minimize dependencies**: Only import required modules

3. **Use global variables** for reusable connections (Firebase Admin SDK already does this)

### Cost Management

1. Monitor usage in Firebase Console
2. Set up billing alerts
3. Optimize function execution time
4. Use appropriate memory allocation
5. Implement caching where possible

## Rollback

To rollback to a previous deployment:

```bash
# List recent deployments
firebase functions:list

# Rollback to specific version (if needed)
# Note: Firebase doesn't have direct rollback, you'll need to redeploy previous code
```

## Support

For issues or questions:
- Check Firebase documentation: https://firebase.google.com/docs/functions
- Review logs: `firebase functions:log`
- Contact the development team

## Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Firebase Console](https://console.firebase.google.com)
