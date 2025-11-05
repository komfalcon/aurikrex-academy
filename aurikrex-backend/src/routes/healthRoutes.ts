import { Router } from 'express';
import { systemInfo } from '../controllers/healthController.js';

const router = Router();

/**
 * @route GET /api/health
 * @description Basic health check endpoint
 * @access Public
 */
router.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route GET /api/health/system
 * @description Detailed system health information
 * @access Private
 */
router.get('/system', systemInfo);

export default router;