import { Router } from "express";
import testRoutes from "./testRoutes.js";
import lessonRoutes from "./lessonRoutes.js";
import healthRoutes from "./healthRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";
const router = Router();
// Test routes
router.use("/test", testRoutes);
// Lesson routes
router.use("/lessons", lessonRoutes);
// Health routes
router.use("/health", healthRoutes);
// Analytics routes
router.use("/analytics", analyticsRoutes);
export default router;
//# sourceMappingURL=index.js.map