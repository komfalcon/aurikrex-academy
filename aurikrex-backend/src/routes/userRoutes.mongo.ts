import { Router } from 'express';
import { query } from 'express-validator';
import { checkUsernameAvailability } from '../controllers/userController.mongo.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH, USERNAME_PATTERN, USERNAME_VALIDATION_MESSAGE } from '../utils/username.js';

const router = Router();

/**
 * @route   GET /api/users/check-username
 * @desc    Check if a username is available
 * @access  Public
 */
router.get(
  '/check-username',
  [
    query('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: USERNAME_MIN_LENGTH, max: USERNAME_MAX_LENGTH })
      .withMessage(USERNAME_VALIDATION_MESSAGE)
      .matches(USERNAME_PATTERN)
      .withMessage(USERNAME_VALIDATION_MESSAGE),
    query('excludeUserId')
      .optional()
      .isMongoId()
      .withMessage('excludeUserId must be a valid MongoDB user ID')
  ],
  validateRequest,
  checkUsernameAvailability
);

export default router;
