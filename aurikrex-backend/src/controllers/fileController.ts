/**
 * File Controller
 * 
 * Handles file-related HTTP requests for text extraction.
 * Provides an endpoint for extracting text from images, PDFs, and text files.
 */

import { Request, Response } from 'express';
import { log } from '../utils/logger.js';
import { fileExtractorService, ExtractableFileType, ExtractionOptions } from '../services/FileExtractorService.js';

/**
 * POST /api/files/extract-text
 * 
 * Extract text from an uploaded file (image, PDF, or text file)
 * 
 * Request body:
 * {
 *   "fileData": "base64 encoded file data or URL",
 *   "fileType": "image | pdf | text" (optional, will be auto-detected),
 *   "mimeType": "mime type of file" (optional, for auto-detection),
 *   "fileName": "original file name" (optional, for auto-detection),
 *   "options": {
 *     "language": "eng" (OCR language, default: eng),
 *     "maxTextLength": 50000 (max characters, default: 50000)
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "extractedText": "The text content from the file",
 *   "confidence": 95 (OCR confidence, only for images),
 *   "wordCount": 150,
 *   "fileType": "image | pdf | text",
 *   "processingTimeMs": 1500
 * }
 */
export const extractTextFromFile = async (req: Request, res: Response): Promise<void> => {
  const requestTimestamp = new Date().toISOString();

  try {
    const { fileData, fileType, mimeType, fileName, options } = req.body;
    const userId = (req as any).user?.userId;

    // Log request details
    log.info('📄 Text extraction request received', {
      userId,
      hasFileData: !!fileData,
      fileType,
      mimeType,
      fileName,
      timestamp: requestTimestamp,
    });

    // Validate input
    if (!fileData) {
      res.status(400).json({
        status: 'error',
        message: 'File data is required. Provide base64 encoded data or a URL.',
      });
      return;
    }

    // Prepare extraction options
    const extractionOptions: ExtractionOptions = {
      language: options?.language || 'eng',
      maxTextLength: options?.maxTextLength || 50000,
    };

    // Perform extraction
    const result = await fileExtractorService.extractText(
      fileData,
      fileType as ExtractableFileType | undefined,
      mimeType,
      fileName,
      extractionOptions
    );

    // Log result
    log.info('📄 Text extraction complete', {
      userId,
      success: result.success,
      wordCount: result.wordCount,
      fileType: result.fileType,
      confidence: result.confidence,
      processingTimeMs: result.processingTimeMs,
    });

    if (!result.success) {
      res.status(422).json({
        status: 'error',
        message: result.error || 'Failed to extract text from file',
        fileType: result.fileType,
        processingTimeMs: result.processingTimeMs,
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      extractedText: result.extractedText,
      confidence: result.confidence,
      wordCount: result.wordCount,
      fileType: result.fileType,
      processingTimeMs: result.processingTimeMs,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    log.error('❌ Text extraction failed', {
      error: errorMessage,
      timestamp: requestTimestamp,
    });

    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};

/**
 * GET /api/files/supported-types
 * 
 * Get list of supported file types for text extraction
 */
export const getSupportedFileTypes = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    status: 'success',
    supportedTypes: {
      image: {
        extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff', '.tif'],
        mimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'],
        description: 'Image files processed using OCR (Tesseract.js)',
      },
      pdf: {
        extensions: ['.pdf'],
        mimeTypes: ['application/pdf'],
        description: 'PDF documents with text extraction',
      },
      text: {
        extensions: ['.txt', '.md', '.csv'],
        mimeTypes: ['text/plain', 'text/markdown', 'text/csv'],
        description: 'Plain text files read directly',
      },
    },
    notes: [
      'Images are processed using OCR - quality depends on image clarity',
      'PDFs must contain selectable text (scanned PDFs will have minimal text)',
      'Maximum file size is 10MB',
      'Maximum extracted text is 50,000 characters by default',
    ],
  });
};
