# Aurikrex Academy Cloud Functions

This directory contains the Firebase Cloud Functions for the Aurikrex Academy backend.

## Overview

The backend has been migrated from a standalone Express.js server to Firebase Cloud Functions, providing:

- **Serverless Architecture**: Automatic scaling and high availability
- **Cost Efficiency**: Pay only for actual usage
- **Integrated Services**: Seamless integration with Firebase services (Firestore, Auth, Storage)
- **Easy Deployment**: Simple deployment with Firebase CLI

## Structure

```
functions/
├── src/                    # Source code
│   ├── config/            # Configuration files (Firebase, etc.)
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Express middleware
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic services
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── index.ts          # Main Cloud Functions entry point
│   └── server.ts         # Legacy server file (kept for reference)
├── lib/                   # Compiled JavaScript (gitignored)
├── .env.example          # Environment variables template
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Build

```bash
npm run build
```

### 4. Test Locally (with emulators)

```bash
npm run serve
```

## Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run clean` - Remove compiled files
- `npm run serve` - Start Firebase emulators for local testing
- `npm run deploy` - Deploy functions to Firebase
- `npm run logs` - View function logs

## API Endpoints

All endpoints are prefixed with `/api`:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Lessons
- `GET /api/lessons` - List lessons
- `GET /api/lessons/:id` - Get lesson by ID
- `POST /api/lessons` - Create new lesson
- `PUT /api/lessons/:id` - Update lesson
- `DELETE /api/lessons/:id` - Delete lesson
- `POST /api/lessons/generate` - Generate lesson with AI

### Health
- `GET /api/health` - Check API health status

### Analytics
- `GET /api/analytics/stats` - Get analytics statistics
- `POST /api/analytics/track` - Track analytics event

### Testing
- `GET /api/test/ai` - Test AI service integration

## Environment Variables

### Required

```env
# Firebase Configuration (for local development)
FIREBASE_PROJECT_ID=aurikrex-academy1
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_DATABASE_URL="..."
FIREBASE_STORAGE_BUCKET="..."

# AI Services
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...

# Security
JWT_SECRET=your-secure-secret-32-chars-min
```

### Optional

```env
# Email Configuration
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=465
EMAIL_USER=info@aurikrex.tech
EMAIL_PASS=your-password

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Development
NODE_ENV=development
```

## Development

### TypeScript

The codebase uses TypeScript with strict mode enabled. Key configurations:

- Target: ES2020
- Module: ESNext
- Strict type checking enabled
- Source maps enabled for debugging

### Code Structure

#### Services Layer
All business logic is encapsulated in service classes:
- `AuthService` - Authentication and user management
- `LessonService` - Lesson CRUD and AI generation
- `StorageService` - File upload/download
- `EmailService` - Email notifications
- `AnalyticsService` - Usage tracking

#### Controllers Layer
Controllers handle HTTP requests and responses:
- Parse request data
- Call appropriate services
- Format responses
- Handle errors

#### Middleware
Custom middleware for:
- Rate limiting (`apiLimiter`)
- Request logging (`requestLogger`)
- CORS handling
- Error handling
- Input sanitization
- Validation

## Firebase Integration

### Authentication
Uses Firebase Authentication for user management:
```typescript
import { auth } from './config/firebase';
const user = await auth.getUserByEmail(email);
```

### Firestore
NoSQL database for storing application data:
```typescript
import { db } from './config/firebase';
const doc = await db.collection('lessons').doc(id).get();
```

### Storage
File storage for user uploads and generated content:
```typescript
import { storage } from './config/firebase';
const bucket = storage.bucket();
```

## Error Handling

Custom error classes provide structured error handling:

```typescript
import { AppError, ValidationError, NotFoundError } from './utils/errors';

// Throw custom errors
throw new ValidationError('Invalid input', { field: 'email' });
throw new NotFoundError('User not found');

// Errors are automatically formatted in responses
{
  "status": "error",
  "code": "validation_error",
  "message": "Invalid input",
  "details": { "field": "email" }
}
```

## Logging

Winston logger with different log levels:

```typescript
import { log } from './utils/logger';

log.info('User logged in', { userId: user.id });
log.error('Database error', { error: err.message });
log.warn('Rate limit exceeded', { ip: req.ip });
```

## Testing

### Manual Testing

Use tools like curl or Postman:

```bash
curl http://localhost:5001/aurikrex-academy1/us-central1/api/health
```

### Unit Tests

(To be added - test files are in `src/tests/`)

## Deployment

See [FIREBASE_DEPLOYMENT.md](../FIREBASE_DEPLOYMENT.md) for detailed deployment instructions.

Quick deploy:

```bash
# From repository root
firebase deploy --only functions
```

## Monitoring

View logs in Firebase Console or via CLI:

```bash
firebase functions:log --only api
```

Monitor performance metrics:
- Invocations
- Execution time
- Memory usage
- Error rate

## Security

### API Security Measures

1. **Rate Limiting**: Prevents abuse with configurable limits
2. **CORS**: Restricted to allowed origins
3. **Input Validation**: All inputs validated with express-validator
4. **Sanitization**: XSS prevention through input sanitization
5. **Authentication**: JWT-based authentication
6. **Firebase Security Rules**: Database and storage protected

### Best Practices

- Never commit `.env` files
- Use environment variables for secrets
- Keep dependencies updated
- Review Firebase Security Rules regularly
- Monitor function logs for suspicious activity

## Troubleshooting

### Common Issues

**Build fails**
```bash
npm run clean
npm install
npm run build
```

**Emulator won't start**
```bash
firebase emulators:start --only functions
```

**Environment variables not loading**
- Check `.env` file exists in `functions/` directory
- Verify environment variable names match those in code

**Function timeout**
- Increase timeout in `firebase.json`
- Optimize slow queries
- Check for infinite loops

## Migration Notes

This backend was migrated from `aurikrex-backend/` to work as Firebase Cloud Functions:

### Key Changes

1. **Entry Point**: Changed from `server.ts` starting Express server to `index.ts` exporting Cloud Functions
2. **Environment Config**: Adapted to use Firebase Functions config in production
3. **Firebase Admin**: Modified to use default credentials in Cloud Functions
4. **Port Binding**: No longer binds to a port; HTTP requests handled by Cloud Functions
5. **Deployment**: Changed from PM2/Node.js to Firebase deployment

### Compatibility

- All existing API endpoints remain the same
- Frontend integration unchanged
- Same authentication flow
- Identical database schema

## Contributing

When adding new features:

1. Add types in `src/types/`
2. Implement service logic in `src/services/`
3. Create controller in `src/controllers/`
4. Define routes in `src/routes/`
5. Add middleware if needed
6. Update this README

## Support

For questions or issues:
- Check Firebase Functions documentation
- Review logs: `firebase functions:log`
- Contact the development team

## License

ISC
