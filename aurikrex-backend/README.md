# Aurikrex Academy Backend

This is the legacy backend implementation using MongoDB Atlas. The project has been migrated to Firebase Cloud Functions (see `/functions` directory), but this backend is kept for reference and alternative deployment scenarios.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB Atlas account

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Test MongoDB connection:**
   ```bash
   node test-mongo-connection.js
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## 🔧 MongoDB Atlas Setup

### First-time Setup

1. **Create MongoDB Atlas Account:**
   - Go to https://cloud.mongodb.com/
   - Sign up for a free account

2. **Create a Cluster:**
   - Create a free M0 cluster
   - Choose a cloud provider and region
   - Wait for cluster to be created

3. **Create Database User:**
   - Go to Database Access
   - Click "Add New Database User"
   - Choose username and password
   - Set permissions to "Read and write to any database"
   - Save credentials securely

4. **Whitelist Your IP:**
   - Go to Network Access
   - Click "Add IP Address"
   - Either add current IP or allow all (0.0.0.0/0) for development

5. **Get Connection String:**
   - Go to Clusters
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

6. **Update .env file:**
   ```bash
   MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?appName=Cluster0
   ```

### 🔑 MongoDB Password Recovery

**Forgot your MongoDB password?** Follow these steps:

1. Login to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Select your project
3. Go to **Database Access** (under Security)
4. Find your database user
5. Click **Edit** (pencil icon)
6. Click **Edit Password**
7. Generate or set a new password
8. Copy the password immediately
9. Update `MONGO_URI` in your `.env` file

**Important**: URL-encode special characters in your password:
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`
- `?` → `%3F`
- `#` → `%23`
- `%` → `%25`

**For detailed troubleshooting**, see [MONGODB_TROUBLESHOOTING.md](../MONGODB_TROUBLESHOOTING.md) in the repository root.

## 🧪 Testing MongoDB Connection

We provide a test script to verify your MongoDB connection:

```bash
node test-mongo-connection.js
```

This script will:
- ✅ Check if .env file is configured
- ✅ Test connection to MongoDB Atlas
- ✅ Verify database access
- ✅ List available databases and collections
- ✅ Provide specific error messages and solutions

**Example output (success):**
```
╔════════════════════════════════════════════════════════════╗
║     MongoDB Atlas Connection Test                         ║
╚════════════════════════════════════════════════════════════╝

📋 Step 1: Checking environment configuration...
✅ MONGO_URI is set
   URI: mongodb+srv://username:****@cluster0.xxxxx.mongodb.net/...
   Database: aurikrex-academy
   Username: username
   Host: cluster0.xxxxx.mongodb.net

📋 Step 2: Testing MongoDB connection...
⏳ Attempting to connect (timeout: 10 seconds)...

✅ Connected successfully in 1234ms

📋 Step 3: Testing database ping...
✅ Ping successful (123ms)

╔════════════════════════════════════════════════════════════╗
║  🎉 CONNECTION TEST PASSED                                ║
╚════════════════════════════════════════════════════════════╝

✅ Your MongoDB connection is working correctly!
✅ You can now run: npm run dev
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `node test-mongo-connection.js` - Test MongoDB connection

## 📁 Project Structure

```
aurikrex-backend/
├── src/
│   ├── config/          # Configuration files
│   │   └── mongodb.ts   # MongoDB connection setup
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.ts        # Express server entry point
├── logs/                # Application logs
├── .env.example         # Environment variables template
├── test-mongo-connection.js  # MongoDB connection test
└── package.json         # Dependencies and scripts
```

## 🔒 Environment Variables

Copy `.env.example` to `.env` and update with your values:

```bash
# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
MONGO_DB_NAME=aurikrex-academy

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# AI Services
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...

# Email (optional)
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=info@aurikrex.tech
EMAIL_PASS=your-email-password
```

## 🐛 Troubleshooting

### Connection Issues

**Error: "Server selection timed out"**
- ✅ Check if your IP is whitelisted in MongoDB Atlas Network Access
- ✅ Disable VPN and try again
- ✅ Verify firewall settings

**Error: "Authentication failed"**
- ✅ Verify username and password are correct
- ✅ Check for special characters (must be URL-encoded)
- ✅ Reset password in MongoDB Atlas if needed

**Error: "ENOTFOUND"**
- ✅ Check your connection string format
- ✅ Verify cluster hostname in MongoDB Atlas
- ✅ Check your internet connection

For detailed troubleshooting:
- 📖 See [MONGODB_TROUBLESHOOTING.md](../MONGODB_TROUBLESHOOTING.md)
- 🧪 Run `node test-mongo-connection.js`
- 🔍 Check logs in `logs/server.log`

### Build Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild TypeScript
npm run build
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh` - Refresh access token

### Lesson Endpoints

- `POST /api/lessons/generate` - Generate AI lesson
- `GET /api/lessons` - List lessons
- `GET /api/lessons/:id` - Get specific lesson
- `PUT /api/lessons/:id` - Update lesson
- `DELETE /api/lessons/:id` - Delete lesson

### Health Check

```bash
curl http://localhost:5000/health
```

## 🚀 Deployment

This backend can be deployed to various platforms:

- **Cyclic.sh** - Serverless Node.js hosting
- **Heroku** - Cloud platform
- **DigitalOcean** - VPS hosting
- **AWS EC2** - Cloud computing

However, **Firebase Cloud Functions** is the recommended deployment method (see `/functions` directory).

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Input validation and sanitization
- Environment variables for secrets

## 📞 Support

- **Documentation**: See `/MONGODB_TROUBLESHOOTING.md`
- **Issues**: Create an issue on GitHub
- **Email**: info@aurikrex.tech

## ⚠️ Note

This backend implementation is deprecated in favor of Firebase Cloud Functions. For new deployments, use the `/functions` directory instead.

---

**Last Updated**: November 2024
