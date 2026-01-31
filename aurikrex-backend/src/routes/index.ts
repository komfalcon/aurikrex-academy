import { Router } from "express";
import authRoutes from "./authRoutes.mongo.js";
import lessonRoutes from "./lessonRoutes.mongo.js";
import analyticsRoutes from "./analyticsRoutes.mongo.js";
import userRoutes from "./userRoutes.mongo.js";
import testRoutes from "./testRoutes.js";
import healthRoutes from "./healthRoutes.js";
import aiRoutes from "./aiRoutes.js";
import falkeaiAnalyticsRoutes from "./falkeaiAnalyticsRoutes.js";

const router = Router();

// Auth routes (MongoDB-based)
router.use("/auth", authRoutes);

// Lesson routes (MongoDB-based)
router.use("/lessons", lessonRoutes);

// Analytics routes (MongoDB-based - lesson analytics)
router.use("/analytics", analyticsRoutes);

// User routes (MongoDB-based)
router.use("/users", userRoutes);

// Test routes
router.use("/test", testRoutes);

// Health routes
router.use("/health", healthRoutes);

// AI routes (FalkeAI integration)
router.use("/ai", aiRoutes);

// FalkeAI Analytics routes (activity tracking and user analytics)
router.use("/falkeai-analytics", falkeaiAnalyticsRoutes);

export default router;
