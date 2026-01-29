/**
 * File Routes
 * 
 * API routes for file-related operations:
 * - POST /api/files/extract-text - Extract text from files (images, PDFs, text)
 * - GET /api/files/supported-types - Get list of supported file types
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { extractTextFromFile, getSupportedFileTypes } from '../controllers/fileController.js';
import { authenticate as authenticateJWT } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';

const router = Router();

/**
 * POST /api/files/extract-text
 * Extract text from an uploaded file
 * Requires authentication
 */
router.post(
  '/extract-text',
  authenticateJWT,
  [
    body('fileData')
      .notEmpty()
      .withMessage('fileData is required')
      .isString()
      .withMessage('fileData must be a string (base64 or URL)'),
    body('fileType')
      .optional()
      .isIn(['image', 'pdf', 'text'])
      .withMessage('fileType must be one of: image, pdf, text'),
    body('mimeType')
      .optional()
      .isString()
      .withMessage('mimeType must be a string'),
    body('fileName')
      .optional()
      .isString()
      .withMessage('fileName must be a string'),
    body('options')
      .optional()
      .isObject()
      .withMessage('options must be an object'),
    body('options.language')
      .optional()
      .isString()
      .withMessage('options.language must be a string'),
    body('options.maxTextLength')
      .optional()
      .isInt({ min: 100, max: 100000 })
      .withMessage('options.maxTextLength must be between 100 and 100000'),
  ],
  validateRequest,
  extractTextFromFile
);

/**
 * GET /api/files/supported-types
 * Get list of supported file types
 * No authentication required
 */
router.get('/supported-types', getSupportedFileTypes);

export default router;
