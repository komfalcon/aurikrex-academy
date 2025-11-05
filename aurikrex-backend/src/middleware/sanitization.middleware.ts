import { Request, Response, NextFunction } from 'express';
import { validationResult, matchedData } from 'express-validator';
import { log } from '../utils/logger.js';

export const sanitizeAndValidate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    log.warn('Input validation failed', {
      errors: errors.array(),
      path: req.path,
      method: req.method
    });
    
    res.status(400).json({
      status: 'error',
      message: 'Invalid input data',
      errors: errors.array()
    });
    return;
  }

  // Replace request body with sanitized data
  req.body = matchedData(req, {
    locations: ['body'],
    includeOptionals: true
  });

  next();
};