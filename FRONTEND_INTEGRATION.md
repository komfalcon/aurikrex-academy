# Frontend Integration with Firebase Functions

This document describes how the frontend integrates with the migrated Firebase Cloud Functions backend.

## Overview

The backend API has been migrated to Firebase Cloud Functions, but the frontend integration remains largely unchanged. The API endpoints and authentication flow are identical to the previous setup.

## Configuration Changes

### Environment Variables

Update your frontend `.env` file with the new API URL:

#### For Local Development

When running Firebase emulators locally:

```env
# aurikrex-frontend/.env
VITE_API_URL=http://localhost:5001/aurikrex-academy1/us-central1/api
```

Or if you're running the emulator with hosting rewrites:

```env
VITE_API_URL=http://localhost:5000/api
```

#### For Production

When deployed to Firebase Hosting with the rewrites configured in `firebase.json`:

```env
# Production
VITE_API_URL=https://your-domain.com/api

# Or direct Cloud Functions URL
VITE_API_URL=https://us-central1-aurikrex-academy1.cloudfunctions.net/api
```

### Firebase Hosting Rewrites

The `firebase.json` file configures URL rewrites so that requests to `/api/**` are automatically routed to the Cloud Functions:

```json
{
  "hosting": {
    "public": "aurikrex-frontend/dist",
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

This means:
- Frontend users access API at: `https://your-domain.com/api/...`
- Requests are internally routed to the Cloud Function
- No CORS issues when frontend and API are on the same domain

## API Endpoints

All API endpoints remain the same. No changes required in frontend code.

### Authentication Endpoints

```typescript
// Login
POST /api/auth/login
Body: { email: string, password: string }

// Register
POST /api/auth/register
Body: { email: string, password: string, name: string }

// Logout
POST /api/auth/logout

// Get Profile
GET /api/auth/profile
Headers: { Authorization: "Bearer <token>" }
```

### Lesson Endpoints

```typescript
// Get all lessons
GET /api/lessons

// Get specific lesson
GET /api/lessons/:id

// Create lesson
POST /api/lessons
Body: { title: string, description: string, ... }

// Generate lesson with AI
POST /api/lessons/generate
Body: { topic: string, difficulty: string, ... }

// Update lesson
PUT /api/lessons/:id
Body: { title: string, description: string, ... }

// Delete lesson
DELETE /api/lessons/:id
```

### Health Check

```typescript
// Check API health
GET /api/health
```

## Frontend Code Examples

### Using the API

The frontend should use the `VITE_API_URL` environment variable:

```typescript
// src/config/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return response.json();
    },
  },
  
  lessons: {
    getAll: async () => {
      const response = await fetch(`${API_URL}/lessons`);
      return response.json();
    },
    
    generate: async (data: any) => {
      const response = await fetch(`${API_URL}/lessons/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
  },
};
```

### Authentication Flow

The authentication flow remains unchanged:

1. User signs up/logs in via Firebase Auth (client SDK)
2. Frontend gets ID token from Firebase Auth
3. Frontend includes token in API requests
4. Cloud Functions verify token using Firebase Admin SDK
5. Protected routes return user-specific data

```typescript
// Example: Making authenticated requests
import { getAuth } from 'firebase/auth';

async function makeAuthenticatedRequest(endpoint: string) {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('Not authenticated');
  }
  
  const token = await user.getIdToken();
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response.json();
}
```

## Testing Integration

### 1. Test Health Endpoint

```typescript
// Test if API is reachable
const testHealth = async () => {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    console.log('API Health:', data);
    return data.status === 'ok';
  } catch (error) {
    console.error('API Health Check Failed:', error);
    return false;
  }
};
```

### 2. Test Authentication

```typescript
// Test login
const testLogin = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword',
      }),
    });
    const data = await response.json();
    console.log('Login Response:', data);
  } catch (error) {
    console.error('Login Test Failed:', error);
  }
};
```

## Development Workflow

### Running Locally

1. **Start Firebase Emulators** (in repository root):
   ```bash
   firebase emulators:start
   ```

2. **Start Frontend Dev Server** (in aurikrex-frontend):
   ```bash
   npm run dev
   ```

3. **Update Frontend .env**:
   ```env
   VITE_API_URL=http://localhost:5001/aurikrex-academy1/us-central1/api
   ```

### Building for Production

1. **Build Frontend**:
   ```bash
   cd aurikrex-frontend
   npm run build
   ```

2. **Build Functions**:
   ```bash
   cd functions
   npm run build
   ```

3. **Deploy Everything**:
   ```bash
   # From repository root
   firebase deploy
   ```

## Common Issues

### Issue: CORS Errors

**Solution**: 
- Ensure `ALLOWED_ORIGINS` is configured correctly in Cloud Functions
- When using Firebase Hosting, CORS shouldn't be an issue as both are served from the same domain
- For local development, add `http://localhost:5173` (or your dev port) to allowed origins

### Issue: 404 Not Found

**Solution**:
- Verify `VITE_API_URL` is set correctly
- Check that Cloud Functions are deployed: `firebase deploy --only functions`
- Verify routes in `functions/src/routes/`

### Issue: Authentication Fails

**Solution**:
- Ensure Firebase Auth is configured in both frontend and functions
- Verify token is being sent in `Authorization` header
- Check that Firebase project IDs match

### Issue: API Returns 500 Errors

**Solution**:
- Check Cloud Functions logs: `firebase functions:log`
- Verify environment variables are set: `firebase functions:config:get`
- Ensure all required services (Firestore, Auth, Storage) are enabled

## Monitoring

### Check API Status

Add a status indicator in your frontend:

```typescript
import { useState, useEffect } from 'react';

export function useApiHealth() {
  const [isHealthy, setIsHealthy] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        setIsHealthy(data.status === 'ok');
      } catch (error) {
        setIsHealthy(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkHealth();
    // Check every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  return { isHealthy, loading };
}
```

### Display API Status

```tsx
function ApiStatusIndicator() {
  const { isHealthy, loading } = useApiHealth();
  
  if (loading) return null;
  
  return (
    <div className={`status-indicator ${isHealthy ? 'healthy' : 'unhealthy'}`}>
      API Status: {isHealthy ? '✓ Online' : '✗ Offline'}
    </div>
  );
}
```

## Performance Considerations

### Cold Starts

Cloud Functions may experience cold starts (initial delay when function hasn't been used recently):

- **Impact**: First request may take 1-3 seconds
- **Mitigation**: 
  - Show loading states in UI
  - Implement retry logic for timeouts
  - Consider keeping functions warm with scheduled requests (see FIREBASE_DEPLOYMENT.md)

### Caching

Implement caching on the frontend to reduce API calls:

```typescript
const cache = new Map<string, { data: any; timestamp: number }>();

async function fetchWithCache(url: string, ttl = 60000) {
  const cached = cache.get(url);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const response = await fetch(url);
  const data = await response.json();
  
  cache.set(url, { data, timestamp: Date.now() });
  return data;
}
```

## Migration Checklist

When deploying to production:

- [ ] Update `VITE_API_URL` in frontend `.env`
- [ ] Build frontend: `npm run build`
- [ ] Build functions: `cd functions && npm run build`
- [ ] Deploy to Firebase: `firebase deploy`
- [ ] Test all major API endpoints
- [ ] Verify authentication flow works
- [ ] Check API health endpoint
- [ ] Monitor function logs for errors
- [ ] Verify CORS configuration
- [ ] Test from production domain

## Support

For issues with frontend integration:
- Check browser console for errors
- Review Firebase Functions logs: `firebase functions:log`
- Verify network requests in browser DevTools
- Contact the development team

## See Also

- [Firebase Deployment Guide](./FIREBASE_DEPLOYMENT.md)
- [Functions README](./functions/README.md)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
