import { Request, Response } from 'express';
import { UserModel } from '../models/User.model.js';
import { getErrorMessage } from '../utils/errors.js';
import { log } from '../utils/logger.js';
import { isUsernameValid, USERNAME_VALIDATION_MESSAGE } from '../utils/username.js';

export const checkUsernameAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawUsername = typeof req.query.username === 'string' ? req.query.username.trim() : '';
    const excludeUserId = typeof req.query.excludeUserId === 'string' ? req.query.excludeUserId : undefined;

    if (!rawUsername) {
      res.status(400).json({
        success: false,
        message: 'Username is required'
      });
      return;
    }

    if (!isUsernameValid(rawUsername)) {
      res.status(400).json({
        success: false,
        message: USERNAME_VALIDATION_MESSAGE
      });
      return;
    }

    const existingUser = await UserModel.findByUsername(rawUsername, excludeUserId);
    const available = !existingUser;

    res.status(200).json({
      success: true,
      data: {
        available
      }
    });
  } catch (error) {
    const message = getErrorMessage(error);
    if (message.includes('Invalid user id')) {
      res.status(400).json({
        success: false,
        message
      });
      return;
    }

    log.error('Username availability check failed', { error: message });
    res.status(500).json({
      success: false,
      message: 'Failed to check username availability'
    });
  }
};
