import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import { db, auth, storage } from "./config/firebase.js";
import { log } from "./utils/logger.js";
import validateEnv from "./utils/env.js";
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
    const [dbCheck, authCheck, storageCheck] = await Promise.all([
      db.collection("healthCheck").doc("test").get(),
      auth.listUsers(1),
      storage.bucket()
    ]);

    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
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
      environment: NODE_ENV,
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

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  log.info(`Starting graceful shutdown`, { signal });
  
  server.close(() => {
    log.info("HTTP server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Unhandled rejection handler
process.on("unhandledRejection", (reason: unknown) => {
  log.error("Unhandled rejection", { reason });
});

// Start server
const server = app.listen(PORT, () => {
  log.info(`Server started`, {
    environment: NODE_ENV,
    port: PORT,
    allowedOrigins: ALLOWED_ORIGINS,
    startTime: new Date().toISOString()
  });
});
