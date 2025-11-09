# Aurikrex Academy

A modern e-learning platform built with React, TypeScript, and Firebase, featuring AI-powered lesson generation.

## 🚀 Recent Migration to Firebase Cloud Functions

The backend has been successfully migrated from a standalone Node.js/Express server to **Firebase Cloud Functions**, providing improved scalability, reliability, and cost-efficiency.

## 📁 Project Structure

```
aurikrex-academy/
├── aurikrex-frontend/       # React/TypeScript frontend (Vite)
├── aurikrex-backend/        # Legacy backend (deprecated, kept for reference)
├── functions/               # Firebase Cloud Functions (NEW - Active Backend)
│   ├── src/                # TypeScript source code
│   │   ├── config/        # Firebase and app configuration
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API route definitions
│   │   ├── services/      # Business logic
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   └── index.ts       # Cloud Functions entry point
│   ├── lib/               # Compiled JavaScript (gitignored)
│   └── package.json       # Functions dependencies
├── firebase.json            # Firebase configuration
├── .firebaserc             # Firebase project settings
└── [Documentation files]
```

## 🎯 Features

- **User Authentication**: Secure authentication with Firebase Auth
- **AI-Powered Lessons**: Generate educational content using OpenAI GPT and Google Gemini
- **Interactive Learning**: Engaging UI with progress tracking
- **Analytics**: Track user engagement and learning progress
- **Cloud Storage**: Secure file uploads and management
- **Email Notifications**: Automated email communication via Titan Mail
- **Real-time Updates**: Live data synchronization with Firestore

## 🛠️ Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Firebase SDK for auth and database
- React Router for navigation

### Backend (Cloud Functions)
- Node.js 20
- Express.js
- TypeScript
- Firebase Admin SDK
- OpenAI API
- Google Gemini AI
- Winston for logging

### Infrastructure
- Firebase Hosting (Frontend)
- Firebase Cloud Functions (Backend API)
- Firestore (Database)
- Firebase Storage (File storage)
- Firebase Authentication

## 📚 Documentation

- **[Firebase Deployment Guide](./FIREBASE_DEPLOYMENT.md)** - Complete deployment instructions
- **[Frontend Integration Guide](./FRONTEND_INTEGRATION.md)** - Frontend setup and API integration
- **[Functions README](./functions/README.md)** - Backend Cloud Functions documentation
- **[Authentication Documentation](./AUTH_DOCUMENTATION.md)** - Authentication flow and implementation
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Overall project implementation details
- **[Security Summary](./SECURITY_SUMMARY.md)** - Security measures and best practices

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher
- Firebase CLI: `npm install -g firebase-tools`
- Firebase account with project access

### 1. Clone the Repository

```bash
git clone https://github.com/komfalcon/aurikrex-academy.git
cd aurikrex-academy
```

### 2. Set Up Firebase Functions

```bash
cd functions
npm install
cp .env.example .env
# Edit .env with your configuration
npm run build
```

### 3. Set Up Frontend

```bash
cd ../aurikrex-frontend
npm install
cp .env.example .env
# Edit .env with your Firebase config
```

### 4. Run Locally

#### Option A: With Firebase Emulators

```bash
# From repository root
firebase emulators:start
```

Then in another terminal:
```bash
cd aurikrex-frontend
npm run dev
```

#### Option B: Direct Function Development

```bash
# Terminal 1: Start functions
cd functions
npm run serve

# Terminal 2: Start frontend
cd aurikrex-frontend
npm run dev
```

Access the app at: `http://localhost:5173`

## 🌐 Deployment

### Deploy Everything

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
```

### Deploy Only Functions

```bash
firebase deploy --only functions
```

### Deploy Only Hosting

```bash
firebase deploy --only hosting
```

See [FIREBASE_DEPLOYMENT.md](./FIREBASE_DEPLOYMENT.md) for detailed deployment instructions.

## 🔧 Configuration

### Environment Variables

#### Functions (.env)
```env
FIREBASE_PROJECT_ID=aurikrex-academy1
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_DATABASE_URL="..."
FIREBASE_STORAGE_BUCKET="..."
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
JWT_SECRET=your-secure-secret
EMAIL_HOST=smtp.titan.email
EMAIL_USER=info@aurikrex.tech
EMAIL_PASS=your-password
```

#### Frontend (.env)
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_URL=http://localhost:5001/aurikrex-academy1/us-central1/api
```

### Production Environment Variables

For production, use Firebase Functions config:

```bash
firebase functions:config:set \
  openai.api_key="sk-..." \
  gemini.api_key="AIza..." \
  jwt.secret="your-secure-secret" \
  app.allowed_origins="https://yourdomain.com"
```

## 📋 API Endpoints

All endpoints are prefixed with `/api`:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Lessons
- `GET /api/lessons` - List all lessons
- `GET /api/lessons/:id` - Get specific lesson
- `POST /api/lessons` - Create new lesson
- `POST /api/lessons/generate` - Generate AI lesson
- `PUT /api/lessons/:id` - Update lesson
- `DELETE /api/lessons/:id` - Delete lesson

### Health & Analytics
- `GET /api/health` - API health check
- `GET /api/analytics/stats` - Get analytics
- `POST /api/analytics/track` - Track event

## 🧪 Testing

### Health Check

```bash
curl http://localhost:5001/aurikrex-academy1/us-central1/api/health
```

### View Logs

```bash
firebase functions:log
```

### Manual Testing

Use tools like Postman or curl to test endpoints:

```bash
curl -X POST http://localhost:5001/aurikrex-academy1/us-central1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🔒 Security

- **Rate Limiting**: API requests are rate-limited to prevent abuse
- **CORS**: Configured to allow only specified origins
- **Authentication**: JWT-based authentication with Firebase
- **Input Validation**: All inputs validated with express-validator
- **Sanitization**: XSS prevention through input sanitization
- **Environment Variables**: Secrets stored securely, never committed

See [SECURITY_SUMMARY.md](./SECURITY_SUMMARY.md) for detailed security information.

## 📊 Monitoring

### Firebase Console
- Navigate to [Firebase Console](https://console.firebase.google.com)
- View function metrics, logs, and errors
- Monitor database usage
- Track authentication events

### Command Line
```bash
# View function logs
firebase functions:log --only api

# Follow logs in real-time
firebase functions:log --only api --follow

# View specific time period
firebase functions:log --since 1h
```

## 🐛 Troubleshooting

### Common Issues

**Functions won't deploy**
```bash
cd functions
npm run build
# Check for TypeScript errors
```

**CORS errors**
- Verify `ALLOWED_ORIGINS` in functions config
- Check CORS middleware in `functions/src/index.ts`

**Environment variables missing**
```bash
# For local: Check .env file exists
# For production: Check Firebase config
firebase functions:config:get
```

**Frontend can't connect to API**
- Verify `VITE_API_URL` in frontend `.env`
- Check that functions are deployed
- Test health endpoint

See [FIREBASE_DEPLOYMENT.md](./FIREBASE_DEPLOYMENT.md#troubleshooting) for more troubleshooting tips.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 Migration Notes

### What Changed

The backend was migrated from a standalone Express server to Firebase Cloud Functions:

- **Old**: `aurikrex-backend/` with PM2/Node.js deployment
- **New**: `functions/` deployed as Cloud Functions

### What Stayed the Same

- All API endpoints and routes
- Authentication flow
- Database schema
- Frontend integration
- Environment variable structure (with adaptations)

### Benefits of Migration

- ✅ Automatic scaling based on demand
- ✅ Pay only for actual usage
- ✅ Built-in HTTPS and SSL
- ✅ Integrated with Firebase services
- ✅ Simplified deployment process
- ✅ Better monitoring and logging
- ✅ Improved reliability and uptime

## 📄 License

ISC

## 👥 Authors

- **Korede Omotosho** - Initial work and Firebase migration

## 🙏 Acknowledgments

- Firebase team for excellent serverless infrastructure
- OpenAI and Google for AI capabilities
- The open-source community for amazing tools and libraries

## 📞 Support

For questions or support:
- Check the documentation in this repository
- Review Firebase Functions logs
- Open an issue on GitHub
- Contact the development team

---

**Last Updated**: November 2024  
**Status**: ✅ Production Ready (Firebase Functions)  
**Version**: 2.0.0 (Cloud Functions Migration)
