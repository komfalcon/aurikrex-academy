import { Router } from "express";
import authRoutes from "./authRoutes.mongo.js";
import lessonRoutes from "./lessonRoutes.mongo.js";
import analyticsRoutes from "./analyticsRoutes.mongo.js";
import userRoutes from "./userRoutes.mongo.js";
import testRoutes from "./testRoutes.js";
import healthRoutes from "./healthRoutes.js";
import assignmentRoutes from "./assignmentRoutes.js";
import falkeaiAnalyticsRoutes from "./falkeaiAnalyticsRoutes.js";
import bookRoutes from "./bookRoutes.js";
import userLibraryRoutes from "./userLibraryRoutes.js";
import fileRoutes from "./fileRoutes.js";
import conversationRoutes from "./conversationRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";

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

// Assignment routes (assignments and solutions)
router.use("/assignments", assignmentRoutes);

// FalkeAI Analytics routes (activity tracking and user analytics)
router.use("/falkeai-analytics", falkeaiAnalyticsRoutes);

// Book routes (library books)
router.use("/books", bookRoutes);

// User Library routes (reading progress)
router.use("/user-library", userLibraryRoutes);

// File routes (text extraction from images, PDFs, etc.)
router.use("/files", fileRoutes);

// Conversation routes (chat history with FalkeAI)
router.use("/conversations", conversationRoutes);

// Dashboard routes (comprehensive dashboard data)
router.use("/dashboard", dashboardRoutes);

export default router;
