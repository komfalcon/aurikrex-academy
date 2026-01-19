import { Request, Response } from 'express';
import { UserModel } from '../models/User.model.js';
import { getErrorMessage } from '../utils/errors.js';
import { log } from '../utils/logger.js';

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

    const isValidLength = rawUsername.length >= 3 && rawUsername.length <= 30;
    const isValidPattern = /^[a-zA-Z0-9_]+$/.test(rawUsername);

    if (!isValidLength || !isValidPattern) {
      res.status(400).json({
        success: false,
        message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
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
    log.error('Username availability check failed', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to check username availability',
      error: getErrorMessage(error)
    });
  }
};
