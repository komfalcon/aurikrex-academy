# Post-MongoDB Fix: Optimization & Implementation Guide

## Overview

After you whitelist your IP in MongoDB Atlas and the backend connects successfully, follow this guide to implement production-grade optimizations.

---

## Phase 1: Verify MongoDB Connection (5-10 minutes)

### Test the Connection

```bash
cd aurikrex-backend
npm run dev
```

**Look for this in the logs:**
```
🔌 Attempting MongoDB connection (1/5)...
✅ MongoDB Atlas connected successfully
```

### Test Health Endpoint

```bash
curl http://localhost:5000/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "services": {
    "database": "connected",
    "databaseLatency": "15ms",
    "collections": ["users", "lessons", "analytics", ...]
  }
}
```

---

## Phase 2: Test Backend APIs (15-20 minutes)

### 1. Test Authentication Routes

**Signup:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456",
    "fullName": "Test User"
  }'
```

**Expected:** OTP sent to email, user record created

**Verify OTP:**
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"  # Check your email for actual OTP
  }'
```

**Expected:** `{ "verified": true, "token": "eyJ..." }`

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456"
  }'
```

**Expected:** JWT tokens (access + refresh)

### 2. Test Protected Routes

**Get Dashboard:**
```bash
curl http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** User dashboard data

### 3. Check Database Content

**In MongoDB Atlas:**
1. Go to Collections
2. Expand `aurikrex-academy` database
3. Check `users` collection
4. Should see your test user

---

## Phase 3: Optimize Backend (Implement When Needed)

### A. Enhanced Connection Pooling

**File:** `aurikrex-backend/src/config/mongodb.ts`

**Current settings (Development):**
```typescript
maxPoolSize: 10,        // Development
minPoolSize: 2,
```

**For Production:**
```typescript
maxPoolSize: 50,        // Production
minPoolSize: 10,
maxIdleTimeMS: 60000,   // Close connections after 1 min idle
waitQueueTimeoutMS: 10000,
```

**Why:** Higher pool size handles more concurrent connections in production.

### B. Add Connection Monitoring

**Create file:** `aurikrex-backend/src/utils/mongo-monitor.ts`

```typescript
import { getDB } from '../config/mongodb.js';
import { log } from './logger.js';

export async function monitorConnectionPool() {
  setInterval(async () => {
    try {
      const client = getDB().getClient?.();
      if (client) {
        const poolStatus = client.topology?.s?.pool;
        log.debug('MongoDB Pool Stats', {
          checkedOut: poolStatus?.checkedOut,
          waitingCount: poolStatus?.waitQueue?.length,
          totalConnections: poolStatus?.totalConnectionCount
        });
      }
    } catch (error) {
      // Silently fail for monitoring
    }
  }, 60000); // Every minute
}
```

### C. Implement Query Caching (Optional but Recommended)

**Install Redis:**
```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

**Create file:** `aurikrex-backend/src/config/redis.ts`

```typescript
import Redis from 'ioredis';
import { log } from '../utils/logger.js';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('error', (err) => log.error('Redis error', { error: err.message }));
redis.on('connect', () => log.info('Redis connected'));

export default redis;
```

**Usage Example:**
```typescript
import redis from '../config/redis.js';

// Cache user data
async function getUser(userId: string) {
  const cached = await redis.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);
  
  const user = await db.collection('users').findOne({ _id: userId });
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user)); // 1 hour TTL
  return user;
}
```

### D. Add Request Logging Middleware

**File:** `aurikrex-backend/src/middleware/request-logger.middleware.ts`

Already implemented but verify it's working:

```typescript
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    log.info('API Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
});
```

### E. Database Query Optimization

**For slow user queries:**
```bash
# Create index on frequently queried fields
mongo "mongodb+srv://..." --eval "db.users.createIndex({ email: 1 })"
mongo "mongodb+srv://..." --eval "db.users.createIndex({ verified: 1 })"
```

---

## Phase 4: Frontend Optimization (Check Current Status)

### Current Status ✅
- Build size: **204.2KB** (excellent, target is <300KB)
- Build time: **11.64s** (good)
- Compression: **Enabled**
- Code splitting: **Enabled**

### Optional Enhancements

1. **Enable Image Optimization**
   ```bash
   npm install vite-plugin-image-optimization
   ```

2. **Font Optimization**
   ```typescript
   // In vite.config.ts
   // Preload critical fonts
   // Remove unused fonts from Tailwind
   ```

3. **Route-Based Code Splitting**
   ```typescript
   // Already configured in vite.config.ts
   // Verify lazy loading routes are splitting properly
   ```

---

## Phase 5: Security Hardening (Production Ready)

### Add Helmet for Security Headers

**Install:**
```bash
npm install helmet
npm install --save-dev @types/helmet
```

**File:** `aurikrex-backend/src/server.mongo.ts`

```typescript
import helmet from 'helmet';

app.use(helmet());
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
```

### Add Request Size Limits

**File:** `aurikrex-backend/src/server.mongo.ts`

```typescript
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
```

### Enhance Rate Limiting

**File:** `aurikrex-backend/src/middleware/rate-limit.middleware.ts`

```typescript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful attempts
});

app.post('/api/auth/login', authLimiter, loginController);
app.post('/api/auth/signup', authLimiter, signupController);
```

---

## Phase 6: Testing (20-30 minutes)

### Unit Tests

**Create file:** `aurikrex-backend/src/tests/auth.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Authentication', () => {
  it('should signup user with valid email', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'Test@123456',
        fullName: 'Test User'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message');
  });

  it('should reject duplicate emails', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'existing@example.com',
        password: 'Test@123456',
        fullName: 'Test User'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('already exists');
  });
});
```

**Run tests:**
```bash
npm test
```

### Integration Tests

Test complete flows:
1. Signup → Verify OTP → Login
2. Login → Get Dashboard → Get Analytics
3. Token refresh → Protected endpoint access

### Performance Tests

```bash
# Load test with Apache Bench
ab -n 100 -c 10 http://localhost:5000/api/health

# Should handle 100 requests with 10 concurrent
```

---

## Phase 7: Monitoring Setup

### MongoDB Atlas Monitoring

1. Go to MongoDB Atlas Dashboard
2. Click "Monitoring"
3. Set up alerts for:
   - High CPU usage (>75%)
   - Connection count high (>40)
   - Slow queries (>100ms)
   - Replication lag

### Application Monitoring (Optional)

**Install Sentry for error tracking:**
```bash
npm install @sentry/node @sentry/tracing
```

**Initialize in server:**
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## Phase 8: Production Deployment

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] MongoDB connection verified
- [ ] All API endpoints tested
- [ ] Frontend connects to backend
- [ ] Security headers configured
- [ ] Rate limiting working
- [ ] Error handling comprehensive
- [ ] Environment variables correct
- [ ] Render static IP whitelisted in MongoDB

### Deployment Steps

1. **Get Render Static IP:**
   ```bash
   # Check Render deployment logs
   # Or contact Render support
   ```

2. **Whitelist Render IP in MongoDB Atlas**

3. **Deploy to Render:**
   ```bash
   git push origin main  # Triggers auto-deploy
   ```

4. **Verify Production:**
   ```bash
   curl https://aurikrex-backend.onrender.com/api/health
   ```

5. **Monitor Logs:**
   ```bash
   # Render Dashboard → Your App → Logs
   # Check for "✅ MongoDB connected successfully"
   ```

---

## Rollback Plan

If production deployment has issues:

```bash
# Render will keep previous deployments
# Click "Deploy" button and select previous version
# Or rollback in git:
git revert HEAD
git push origin main
```

---

## Performance Metrics

### Before Optimization
| Metric | Value |
|--------|-------|
| First Load | ~3s |
| API Response | ~200ms |
| Build Size | 204KB |

### After Optimization (Target)
| Metric | Target |
|--------|--------|
| First Load | ~1.5s |
| API Response | <50ms (with caching) |
| Build Size | <200KB |

---

## Maintenance Checklist

### Daily
- [ ] Check MongoDB connection status
- [ ] Monitor error logs
- [ ] Check API response times

### Weekly
- [ ] Review database size
- [ ] Check slow query logs
- [ ] Update dependencies security patches

### Monthly
- [ ] Optimize slow queries
- [ ] Archive old logs
- [ ] Review analytics
- [ ] Backup database

---

## Support & Resources

- **MongoDB**: https://docs.mongodb.com
- **Render**: https://render.com/docs
- **Node.js**: https://nodejs.org/en/docs
- **Express**: https://expressjs.com
- **Jest Testing**: https://jestjs.io

---

**Once MongoDB IP is whitelisted, you're ready to implement these optimizations!**
