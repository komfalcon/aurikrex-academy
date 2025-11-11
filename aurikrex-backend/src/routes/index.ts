import { Router } from "express";
import testRoutes from "./testRoutes.js";
import lessonRoutes from "./lessonRoutes.js";
import healthRoutes from "./healthRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";
import authRoutes from "./authRoutes.js";

const router = Router();

// Auth routes
router.use("/auth", authRoutes);

// Test routes
router.use("/test", testRoutes);

// Lesson routes
router.use("/lessons", lessonRoutes);

// Health routes
router.use("/health", healthRoutes);

// Analytics routes
router.use("/analytics", analyticsRoutes);

export default router;
