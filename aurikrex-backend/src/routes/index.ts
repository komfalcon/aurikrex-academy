import { Router } from "express";
import testRoutes from "./testRoutes";
import lessonRoutes from "./lessonRoutes";
import healthRoutes from "./healthRoutes";
import analyticsRoutes from "./analyticsRoutes";
import authRoutes from "./authRoutes";

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
