import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import passport from "./config/passport.js";
import { connectDB, checkMongoHealth } from "./config/mongodb.js";
import { UserModel } from "./models/User.model.js";
import { LessonModel, LessonProgressModel } from "./models/Lesson.model.js";
import { AnalyticsModel } from "./models/Analytics.model.js";
import { ChatHistoryModel } from "./models/ChatHistory.model.js";
import { log } from "./utils/logger.js";
import validateEnv from "./utils/env.mongo.js";
import { apiLimiter } from "./middleware/rate-limit.middleware.js";
import { requestLogger } from "./middleware/request-logger.middleware.js";

// Validate environment variables
const env = validateEnv();

const app = express();
const PORT = parseInt(env.PORT, 10);
const NODE_ENV = env.NODE_ENV;
const ALLOWED_ORIGINS = env.ALLOWED_ORIGINS.split(",");

// ============================================
// TRUST PROXY CONFIGURATION
// ============================================
// Required for Express to correctly identify client IP behind Nginx/load balancers
// This ensures rate limiting works correctly with X-Forwarded-For headers
// Set to 1 to trust the first proxy (Nginx)
app.set('trust proxy', 1);

// Type for API Error
interface ApiError extends Error {
  status?: number;
  code?: string;
}

// ============================================
// CORS CONFIGURATION
// ============================================
// Configure CORS to allow cross-origin requests from the frontend.
// This is required for OAuth endpoints (/api/auth/github/url, /api/auth/microsoft/url)
// to work without "TypeError: Failed to fetch" errors in the browser.
// Configuration:
//   - origin: Allowed frontend origins (set via ALLOWED_ORIGINS env var)
//   - methods: HTTP methods allowed (GET, POST, OPTIONS for OAuth flows)
//   - allowedHeaders: Headers the frontend can send (Content-Type, Authorization)
//   - credentials: Allow cookies and auth headers
// NOTE: After changes, restart backend using PM2: pm2 restart aurikrex-backend
const corsOptions = {
  origin: ALLOWED_ORIGINS,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

// Apply CORS middleware to all routes
// CORS middleware handles all HTTP methods including OPTIONS preflight
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());  // Enable compression
app.use(requestLogger);  // Enhanced request logging
app.use(apiLimiter);    // Global rate limiting

// Initialize passport for OAuth
app.use(passport.initialize());

// Import routes
import routes from "./routes/index.js";

// Use routes
app.use("/api", routes);

// Health check route
app.get("/health", async (_req: Request, res: Response) => {
  try {
    log.info('🏥 Health check requested');
    
    const mongoHealth = await checkMongoHealth();

    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      services: {
        database: mongoHealth.status,
        databaseLatency: `${mongoHealth.latency}ms`,
        collections: mongoHealth.collections
      },
      message: "Aurikrex Backend is healthy!"
    });
  } catch (error) {
    const apiError = error as ApiError;
    log.error('❌ Health check failed', { error: apiError.message });
    
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      services: {
        database: "disconnected"
      },
      error: {
        message: apiError.message,
        code: apiError.code
      }
    });
  }
});

// Not found middleware
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: "Resource not found"
  });
});

// Error handling middleware
app.use((err: ApiError, req: Request, res: Response, _next: NextFunction) => {
  log.error(`Request error`, {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    code: err.code
  });
  
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
    code: err.code,
    path: req.path
  });
});

// Initialize MongoDB connection and indexes
async function initializeDatabase() {
  try {
    log.info('🔌 Initializing MongoDB connection...');
    
    // Connect to MongoDB
    await connectDB();
    log.info('✅ MongoDB connected successfully');

    // Create indexes for optimal performance
    log.info('📊 Creating database indexes...');
    await Promise.all([
      UserModel.createIndexes(),
      LessonModel.createIndexes(),
      LessonProgressModel.createIndexes(),
      AnalyticsModel.createIndexes(),
      ChatHistoryModel.createIndexes()
    ]);
    log.info('✅ Database indexes created successfully');

  } catch (error) {
    log.error('❌ Database initialization failed', { error });
    log.warn('⚠️  Server will start without database connection');
    log.warn('⚠️  Database-dependent features will be unavailable');
    log.warn('⚠️  Check /health endpoint for connection status');
    // Don't throw - allow server to start without database
  }
}

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  log.info(`Starting graceful shutdown`, { signal });
  
  if (server) {
    server.close(() => {
      log.info("HTTP server closed");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Unhandled rejection handler
process.on("unhandledRejection", (reason: unknown) => {
  log.error("Unhandled rejection", { reason });
});

// Start server
let server: any;

async function startServer() {
  try {
    // Initialize database (non-blocking - server will start even if this fails)
    await initializeDatabase();

    // Start HTTP server
    server = app.listen(PORT, '0.0.0.0', () => {
      log.info(`Server started`, {
        environment: NODE_ENV,
        port: PORT,
        allowedOrigins: ALLOWED_ORIGINS,
        startTime: new Date().toISOString()
      });
      
      // Use environment-aware URL
      const backendURL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
      
      // Use console for banner as it's startup information
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🚀 Aurikrex Academy Backend Server`);
      console.log(`${'='.repeat(60)}`);
      console.log(`📍 Environment: ${NODE_ENV}`);
      console.log(`🌐 Port: ${PORT}`);
      console.log(`🔗 API URL: ${backendURL}/api`);
      console.log(`🏥 Health Check: ${backendURL}/health`);
      console.log(`${'='.repeat(60)}\n`);
    });
  } catch (error) {
    log.error('❌ Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();
