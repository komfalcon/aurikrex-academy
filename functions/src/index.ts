import * as functions from "firebase-functions";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import { db, auth, storage } from "./config/firebase";
import { log } from "./utils/logger";
import { apiLimiter } from "./middleware/rate-limit.middleware";
import { requestLogger } from "./middleware/request-logger.middleware";

// Import routes
import routes from "./routes/index";

// Type for API Error
interface ApiError extends Error {
  status?: number;
  code?: string;
}

// Create Express app
const app = express();

// Get environment configuration from Firebase Functions config
// For local development, you can use .env file with dotenv
// For production, use: firebase functions:config:set app.allowed_origins="https://yourdomain.com"
const isDevelopment = process.env.NODE_ENV !== 'production';
const ALLOWED_ORIGINS = isDevelopment 
  ? [
      "http://localhost:3000", 
      "http://localhost:5173", 
      "https://aurikrex-backend.onrender.com"
    ]
  : [
      // Firebase default domains
      "https://aurikrex-academy12.web.app",
      "https://aurikrex-academy12.firebaseapp.com",
      // Custom domain
      "https://aurikrex.tech",
      // Additional origins from config
      ...(functions.config().app?.allowed_origins || "").split(",").filter((origin: string) => origin.trim())
    ];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      log.warn(`Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());  // Enable compression
app.use(requestLogger);  // Enhanced request logging
app.use(apiLimiter);     // Global rate limiting

// Use routes under /api prefix
// Firebase rewrites will route /api/** to this function
app.use("/api", routes);

// Health check route
app.get("/health", async (_req: Request, res: Response) => {
  try {
    const [dbCheck, authCheck, storageCheck] = await Promise.all([
      db.collection("healthCheck").doc("test").get(),
      auth.listUsers(1),
      storage.bucket()
    ]);

    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      services: {
        database: dbCheck.exists ? "connected" : "no-data",
        auth: authCheck ? "connected" : "error",
        storage: storageCheck ? "connected" : "error"
      },
      message: "Aurikrex Backend is healthy!"
    });
  } catch (error) {
    const apiError = error as ApiError;
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      services: {
        database: "disconnected",
        auth: "disconnected",
        storage: "disconnected"
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

// Export the Express app as a Cloud Function
// This will be accessible at /api/** due to firebase.json rewrite rules
export const api = functions.https.onRequest(app);
