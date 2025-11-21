import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import { connectDB, checkMongoHealth } from "./config/mongodb.js";
import { UserModel } from "./models/User.model.js";
import { LessonModel, LessonProgressModel } from "./models/Lesson.model.js";
import { AnalyticsModel } from "./models/Analytics.model.js";
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

// Type for API Error
interface ApiError extends Error {
  status?: number;
  code?: string;
}

// Middleware
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());  // Enable compression
app.use(requestLogger);  // Enhanced request logging
app.use(apiLimiter);    // Global rate limiting

// Import routes
import routes from "./routes/index.js";

// Use routes
app.use("/api", routes);

// Health check route
app.get("/health", async (_req: Request, res: Response) => {
  try {
    console.log('🏥 Health check requested');
    
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
    console.error('❌ Health check failed:', apiError.message);
    
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
    console.log('🔌 Initializing MongoDB connection...');
    
    // Connect to MongoDB
    await connectDB();
    console.log('✅ MongoDB connected successfully');

    // Create indexes for optimal performance
    console.log('📊 Creating database indexes...');
    await Promise.all([
      UserModel.createIndexes(),
      LessonModel.createIndexes(),
      LessonProgressModel.createIndexes(),
      AnalyticsModel.createIndexes()
    ]);
    console.log('✅ Database indexes created successfully');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.warn('⚠️  Server will start without database connection');
    console.warn('⚠️  Database-dependent features will be unavailable');
    console.warn('⚠️  Check /health endpoint for connection status');
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
    server = app.listen(PORT, () => {
      log.info(`Server started`, {
        environment: NODE_ENV,
        port: PORT,
        allowedOrigins: ALLOWED_ORIGINS,
        startTime: new Date().toISOString()
      });
      
      const backendURL = process.env.BACKEND_URL || `https://aurikrex-backend.onrender.com`;
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
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
