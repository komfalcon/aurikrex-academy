import { Router } from "express";
import authRoutes from "./authRoutes.mongo";
import testRoutes from "./testRoutes";
import healthRoutes from "./healthRoutes";
// Import other routes as needed

const router = Router();

// Auth routes (MongoDB-based)
router.use("/auth", authRoutes);

// Test routes
router.use("/test", testRoutes);

// Health routes
router.use("/health", healthRoutes);

// Analytics routes
// TODO: Update analytics routes to use MongoDB

// Lesson routes
// TODO: Update lesson routes to use MongoDB

export default router;
