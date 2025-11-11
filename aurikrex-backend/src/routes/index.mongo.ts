import { Router } from "express";
import authRoutes from "./authRoutes.mongo";
import lessonRoutes from "./lessonRoutes.mongo";
import analyticsRoutes from "./analyticsRoutes.mongo";
import testRoutes from "./testRoutes";
import healthRoutes from "./healthRoutes";

const router = Router();

// Auth routes (MongoDB-based)
router.use("/auth", authRoutes);

// Lesson routes (MongoDB-based)
router.use("/lessons", lessonRoutes);

// Analytics routes (MongoDB-based)
router.use("/analytics", analyticsRoutes);

// Test routes
router.use("/test", testRoutes);

// Health routes
router.use("/health", healthRoutes);

export default router;
