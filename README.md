# Aurikrex Academy

A modern e-learning platform built with React, TypeScript, MongoDB, and Node.js, featuring AI-powered lesson generation.

## 🚀 Architecture

This is a full-stack application using:
- **Frontend**: React with Vite, deployed on https://aurikrex.tech
- **Backend**: Node.js/Express API running on https://api.aurikrex.tech (PM2)
- **Database**: MongoDB Atlas for data persistence
- **AI Services**: OpenAI GPT and Google Gemini for lesson generation

## 📁 Project Structure

```
aurikrex-academy/
├── aurikrex-frontend/       # React/TypeScript frontend (Vite)
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript type definitions
│   ├── public/             # Static assets
│   ├── vite.config.ts      # Vite configuration
│   └── vercel.json         # Vercel deployment config
├── aurikrex-backend/        # Node.js/Express backend
│   ├── src/
│   │   ├── config/         # MongoDB and app configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # MongoDB data models
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic & AI services
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── dist/               # Compiled JavaScript (gitignored)
│   └── package.json        # Backend dependencies
└── [Documentation files]
```

## 🎯 Features

- **User Authentication**: Secure JWT-based authentication with OTP email verification
- **AI-Powered Lessons**: Generate educational content using OpenAI GPT and Google Gemini
- **Interactive Learning**: Engaging UI with progress tracking
- **Analytics**: Track user engagement and learning progress
- **Assignment Management**: Create, submit, review, and grade assignments
- **Email Notifications**: Automated email communication via Titan Mail SMTP
- **Dashboard**: Comprehensive user dashboard with learning analytics

## 🛠️ Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS with shadcn/ui components
- React Router for navigation
- React Query for data fetching
- JWT for authentication

### Backend
- Node.js 20
- Express.js
- TypeScript
- MongoDB with native driver
- OpenAI API
- Google Gemini AI
- Winston for logging
- Nodemailer for email
- JWT for authentication
- bcryptjs for password hashing

### Infrastructure
- Vercel (Frontend hosting)
- Render (Backend API hosting)
- MongoDB Atlas (Database)
- Titan Mail (SMTP email service)

## 📚 Documentation

- **[Authentication Documentation](./AUTH_DOCUMENTATION.md)** - Authentication flow and implementation
- **[MongoDB Migration Guide](./MONGODB_MIGRATION_SUMMARY.md)** - MongoDB setup and migration details
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Overall project implementation details
- **[Security Summary](./SECURITY_SUMMARY.md)** - Security measures and best practices
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Deployment instructions for Vercel and Render

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher
- MongoDB Atlas account (or local MongoDB instance)
- OpenAI API key (for lesson generation)

### 1. Clone the Repository

```bash
git clone https://github.com/komfalcon/aurikrex-academy.git
cd aurikrex-academy
```

### 2. Set Up Backend

```bash
cd aurikrex-backend
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your configuration:
# - MONGO_URI: Your MongoDB connection string
# - OPENAI_API_KEY: Your OpenAI API key
# - GEMINI_API_KEY: Your Google Gemini API key
# - JWT_SECRET: A secure random string (min 32 chars)
# - EMAIL_HOST, EMAIL_USER, EMAIL_PASS: Your SMTP settings
```

### 3. Set Up Frontend

```bash
cd ../aurikrex-frontend
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your backend URL:
# VITE_API_URL=http://localhost:5000/api  # for local development
# VITE_API_URL=https://your-render-backend.onrender.com/api  # for production
```

### 4. Run Locally

```bash
# Terminal 1: Start backend
cd aurikrex-backend
npm run dev

# Terminal 2: Start frontend
cd aurikrex-frontend
npm run dev
```

Access the app at: `http://localhost:8080`  
Backend API at: `http://localhost:5000/api`

## 🌐 Deployment

### Frontend Deployment (Vercel)

1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `aurikrex-frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add environment variables in Vercel dashboard:
   - `VITE_API_URL`: https://api.aurikrex.tech/api

### Backend Deployment (PM2)

The backend runs on a server with PM2 process manager:

1. Clone the repository on your server
2. Install dependencies:
   ```bash
   cd aurikrex-backend
   npm install
   npm run build
   ```
3. Configure environment variables in `.env`:
   - Copy `.env.example` to `.env`
   - Update `MONGO_URI`, `JWT_SECRET`, `BREVO_API_KEY`, `GOOGLE_CLIENT_ID`, etc.
4. Start with PM2:
   ```bash
   npm run start:pm2
   ```
5. Configure Nginx as reverse proxy for HTTPS

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=production
HOST=0.0.0.0
ALLOWED_ORIGINS=https://aurikrex.tech,https://www.aurikrex.tech

# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/aurikrex-academy
MONGO_DB_NAME=aurikrex-academy

# AI Services
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
CLAUDE_API_KEY=sk-ant-...  # Optional

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# Email (Brevo API)
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=info@aurikrex.tech
BREVO_SENDER_NAME=Aurikrex Academy

# URL Configuration
BACKEND_URL=https://api.aurikrex.tech
FRONTEND_URL=https://aurikrex.tech

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Logging
LOG_LEVEL=debug
LOG_FILE_PATH=logs/server.log

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100
```

#### Frontend (.env)
```env
# Backend API URL
VITE_API_URL=https://api.aurikrex.tech/api

# For local development
# VITE_API_URL=http://localhost:5000/api
```

## 📋 API Endpoints

All endpoints are prefixed with `/api`:

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - Verify email with OTP
- `POST /api/auth/resend-otp` - Resend OTP to email
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (protected)

### Lessons
- `GET /api/lessons` - List all lessons (protected)
- `GET /api/lessons/:id` - Get specific lesson (protected)
- `POST /api/lessons/generate` - Generate AI lesson (protected)
- `PUT /api/lessons/:id/progress` - Update lesson progress (protected)
- `DELETE /api/lessons/:id` - Delete lesson (protected)

### Analytics
- `GET /api/analytics/stats` - Get user analytics (protected)
- `POST /api/analytics/track` - Track learning event (protected)

### Health
- `GET /health` - API health check
- `GET /api/test/ping` - Simple ping test

## 🧪 Testing

### Health Check

```bash
# Local
curl http://localhost:5000/health

# Production
curl https://api.aurikrex.tech/health
```

### Build Tests

```bash
# Test backend build
cd aurikrex-backend
npm run build

# Test frontend build
cd aurikrex-frontend
npm run build
```

### Manual API Testing

Use tools like Postman or curl to test endpoints:

```bash
# Signup
curl -X POST https://api.aurikrex.tech/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"John",
    "lastName":"Doe",
    "email":"john@example.com",
    "password":"SecurePass123!@",
    "phone":"+1234567890"
  }'

# Login
curl -X POST https://api.aurikrex.tech/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123!@"}'
```

## 🔒 Security

- **Rate Limiting**: API requests are rate-limited to prevent abuse (100 requests per 15 minutes)
- **CORS**: Configured to allow only specified origins
- **Authentication**: JWT-based authentication with secure token generation
- **Password Hashing**: bcryptjs with salt rounds for secure password storage
- **OTP Verification**: Email-based OTP for account verification
- **Input Validation**: All inputs validated with express-validator
- **Sanitization**: XSS prevention through input sanitization
- **Environment Variables**: Secrets stored securely, never committed to repository
- **MongoDB Security**: Parameterized queries to prevent injection attacks

See [SECURITY_SUMMARY.md](./SECURITY_SUMMARY.md) for detailed security information.

## 📊 Monitoring

### Render Dashboard
- View backend logs in real-time
- Monitor API performance and uptime
- Track resource usage
- Configure alerts for downtime

### Vercel Dashboard
- Monitor frontend deployments
- View build logs and analytics
- Track page performance
- Configure custom domains

### MongoDB Atlas
- Monitor database performance
- View connection metrics
- Set up alerts for unusual activity
- Manage database backups

### Local Logs
Backend logs are stored in `aurikrex-backend/logs/server.log` during development.

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check MongoDB connection string
# Verify all required environment variables are set
# Check logs for specific errors
cd aurikrex-backend
npm run build
# Look for TypeScript compilation errors
```

**CORS errors**
- Verify `ALLOWED_ORIGINS` includes your frontend URL
- Check that frontend is using correct `VITE_API_URL`
- Ensure origins include the protocol (http:// or https://)

**MongoDB connection timeout**
- Verify MongoDB Atlas IP whitelist includes your server IP
- Check that MongoDB URI is correct
- Ensure network access is configured in MongoDB Atlas

**Frontend can't connect to API**
- Verify `VITE_API_URL` in frontend `.env`
- Test backend health endpoint directly
- Check that backend is running and accessible
- Verify CORS settings allow your frontend origin

**Email OTP not sending**
- Check SMTP credentials in backend `.env`
- Verify `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, and `EMAIL_PASS`
- Check email service logs for errors

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for deployment-specific troubleshooting.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 Architecture Notes

### Database

The application uses **MongoDB Atlas** as its primary database:
- User authentication and profiles
- Lesson content and progress tracking
- Analytics and engagement metrics
- Assignment submissions and grading

### Authentication Flow

1. User signs up with email and password
2. System generates and sends OTP to email
3. User verifies OTP to activate account
4. Upon login, JWT access and refresh tokens are issued
5. Frontend stores tokens in localStorage
6. Protected routes require valid JWT in Authorization header

### AI Integration

- **OpenAI GPT**: Primary AI provider for lesson generation
- **Google Gemini**: Alternative AI provider for lesson generation
- Content moderation and enhancement services
- Caching layer to reduce API costs

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

**Last Updated**: January 2026  
**Status**: ✅ Production Ready (MongoDB + PM2 + Vercel)  
**Version**: 3.1.0 (Authentication & OAuth Fixes)
