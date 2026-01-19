import { Router } from 'express';
import { query } from 'express-validator';
import { checkUsernameAvailability } from '../controllers/userController.mongo.js';
import { validateRequest } from '../middleware/validation.middleware.js';

const router = Router();

/**
 * @route   GET /api/users/check-username
 * @desc    Check if a username is available
 * @access  Public
 */
router.get(
  '/check-username',
  [query('username').trim().notEmpty().withMessage('Username is required')],
  validateRequest,
  checkUsernameAvailability
);

export default router;
