/**
 * File Extractor Service
 * 
 * Handles text extraction from various file types:
 * - Images (using Tesseract.js OCR)
 * - PDFs (using pdf-parse)
 * - Text files (direct reading)
 * 
 * This service enables FalkeAI to understand content from uploaded files
 * by extracting text that can then be processed by the AI.
 */

import { createWorker, Worker, OEM, PSM } from 'tesseract.js';
import pdfParse from 'pdf-parse';
import { log } from '../utils/logger.js';
import axios from 'axios';

/**
 * Supported file types for text extraction
 */
export type ExtractableFileType = 'image' | 'pdf' | 'text';

/**
 * Result of text extraction
 */
export interface TextExtractionResult {
  success: boolean;
  extractedText: string;
  confidence?: number;  // OCR confidence (0-100)
  wordCount: number;
  fileType: ExtractableFileType;
  error?: string;
  processingTimeMs: number;
}

/**
 * Options for text extraction
 */
export interface ExtractionOptions {
  language?: string;  // OCR language (default: 'eng')
  preserveFormatting?: boolean;
  maxTextLength?: number;  // Limit extracted text length
}

/**
 * Default extraction options
 */
const DEFAULT_OPTIONS: ExtractionOptions = {
  language: 'eng',
  preserveFormatting: true,
  maxTextLength: 50000,  // 50K characters max
};

/**
 * MIME types mapped to extractable file types
 */
const MIME_TYPE_MAP: Record<string, ExtractableFileType> = {
  // Images
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/bmp': 'image',
  'image/tiff': 'image',
  // PDFs
  'application/pdf': 'pdf',
  // Text
  'text/plain': 'text',
  'text/markdown': 'text',
  'text/csv': 'text',
};

/**
 * File extension to type mapping
 */
const EXTENSION_TYPE_MAP: Record<string, ExtractableFileType> = {
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.gif': 'image',
  '.webp': 'image',
  '.bmp': 'image',
  '.tiff': 'image',
  '.tif': 'image',
  '.pdf': 'pdf',
  '.txt': 'text',
  '.md': 'text',
  '.csv': 'text',
};

/**
 * File Extractor Service
 * Extracts text from images, PDFs, and text files
 */
class FileExtractorService {
  private ocrWorker: Worker | null = null;
  private isWorkerReady = false;

  constructor() {
    log.info('📄 FileExtractorService initialized');
  }

  /**
   * Initialize the OCR worker (lazy initialization)
   */
  private async initializeOcrWorker(language: string = 'eng'): Promise<Worker> {
    if (this.ocrWorker && this.isWorkerReady) {
      return this.ocrWorker;
    }

    log.info('🔧 Initializing Tesseract OCR worker...');
    
    try {
      this.ocrWorker = await createWorker(language, OEM.LSTM_ONLY, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            log.debug(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      // Configure for best accuracy
      await this.ocrWorker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
      });

      this.isWorkerReady = true;
      log.info('✅ Tesseract OCR worker ready');
      
      return this.ocrWorker;
    } catch (error) {
      log.error('❌ Failed to initialize OCR worker:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Detect file type from MIME type or extension
   */
  public detectFileType(mimeType?: string, fileName?: string): ExtractableFileType | null {
    // Try MIME type first
    if (mimeType && MIME_TYPE_MAP[mimeType.toLowerCase()]) {
      return MIME_TYPE_MAP[mimeType.toLowerCase()];
    }

    // Fall back to extension
    if (fileName) {
      const ext = fileName.toLowerCase().match(/\.[^.]+$/)?.[0];
      if (ext && EXTENSION_TYPE_MAP[ext]) {
        return EXTENSION_TYPE_MAP[ext];
      }
    }

    return null;
  }

  /**
   * Extract text from an image using OCR
   * @param imageData - Buffer, base64 string, or URL of the image
   * @param options - Extraction options
   */
  public async extractTextFromImage(
    imageData: Buffer | string,
    options: ExtractionOptions = {}
  ): Promise<TextExtractionResult> {
    const startTime = Date.now();
    const opts = { ...DEFAULT_OPTIONS, ...options };

    log.info('🖼️ Starting image OCR extraction...');

    try {
      // Handle URL if provided
      let imageBuffer: Buffer | string = imageData;
      if (typeof imageData === 'string' && imageData.startsWith('http')) {
        log.info('📥 Downloading image from URL...');
        const response = await axios.get(imageData, { 
          responseType: 'arraybuffer',
          timeout: 30000,
        });
        imageBuffer = Buffer.from(response.data);
      }

      // Initialize worker
      const worker = await this.initializeOcrWorker(opts.language);

      // Perform OCR
      log.info('🔍 Performing OCR on image...');
      const result = await worker.recognize(imageBuffer);
      
      let extractedText = result.data.text || '';
      const confidence = result.data.confidence || 0;

      // Trim to max length if needed
      if (opts.maxTextLength && extractedText.length > opts.maxTextLength) {
        extractedText = extractedText.substring(0, opts.maxTextLength);
        log.warn(`⚠️ Text truncated to ${opts.maxTextLength} characters`);
      }

      const processingTimeMs = Date.now() - startTime;
      const wordCount = extractedText.trim().split(/\s+/).filter(w => w.length > 0).length;

      log.info('✅ OCR extraction complete', {
        confidence: Math.round(confidence),
        wordCount,
        processingTimeMs,
      });

      return {
        success: true,
        extractedText,
        confidence: Math.round(confidence),
        wordCount,
        fileType: 'image',
        processingTimeMs,
      };
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      log.error('❌ OCR extraction failed:', { error: errorMessage });
      
      return {
        success: false,
        extractedText: '',
        wordCount: 0,
        fileType: 'image',
        error: errorMessage,
        processingTimeMs,
      };
    }
  }

  /**
   * Extract text from a PDF document
   * @param pdfData - Buffer or base64 string of the PDF
   * @param options - Extraction options
   */
  public async extractTextFromPdf(
    pdfData: Buffer | string,
    options: ExtractionOptions = {}
  ): Promise<TextExtractionResult> {
    const startTime = Date.now();
    const opts = { ...DEFAULT_OPTIONS, ...options };

    log.info('📄 Starting PDF text extraction...');

    try {
      // Convert base64 to buffer if needed
      let pdfBuffer: Buffer;
      if (typeof pdfData === 'string') {
        if (pdfData.startsWith('http')) {
          // Download from URL
          log.info('📥 Downloading PDF from URL...');
          const response = await axios.get(pdfData, { 
            responseType: 'arraybuffer',
            timeout: 30000,
          });
          pdfBuffer = Buffer.from(response.data);
        } else {
          // Assume base64
          pdfBuffer = Buffer.from(pdfData, 'base64');
        }
      } else {
        pdfBuffer = pdfData;
      }

      // Parse PDF
      log.info('📖 Parsing PDF content...');
      const pdfResult = await pdfParse(pdfBuffer);
      
      let extractedText = pdfResult.text || '';

      // Trim to max length if needed
      if (opts.maxTextLength && extractedText.length > opts.maxTextLength) {
        extractedText = extractedText.substring(0, opts.maxTextLength);
        log.warn(`⚠️ Text truncated to ${opts.maxTextLength} characters`);
      }

      const processingTimeMs = Date.now() - startTime;
      const wordCount = extractedText.trim().split(/\s+/).filter(w => w.length > 0).length;

      log.info('✅ PDF extraction complete', {
        pages: pdfResult.numpages,
        wordCount,
        processingTimeMs,
      });

      return {
        success: true,
        extractedText,
        wordCount,
        fileType: 'pdf',
        processingTimeMs,
      };
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      log.error('❌ PDF extraction failed:', { error: errorMessage });
      
      return {
        success: false,
        extractedText: '',
        wordCount: 0,
        fileType: 'pdf',
        error: errorMessage,
        processingTimeMs,
      };
    }
  }

  /**
   * Extract text from a text file
   * @param textData - Buffer, string, or URL of the text file
   * @param options - Extraction options
   */
  public async extractTextFromTextFile(
    textData: Buffer | string,
    options: ExtractionOptions = {}
  ): Promise<TextExtractionResult> {
    const startTime = Date.now();
    const opts = { ...DEFAULT_OPTIONS, ...options };

    log.info('📝 Starting text file extraction...');

    try {
      let extractedText: string;
      
      if (typeof textData === 'string') {
        if (textData.startsWith('http')) {
          // Download from URL
          log.info('📥 Downloading text file from URL...');
          const response = await axios.get(textData, { 
            responseType: 'text',
            timeout: 30000,
          });
          extractedText = response.data;
        } else {
          extractedText = textData;
        }
      } else {
        extractedText = textData.toString('utf-8');
      }

      // Trim to max length if needed
      if (opts.maxTextLength && extractedText.length > opts.maxTextLength) {
        extractedText = extractedText.substring(0, opts.maxTextLength);
        log.warn(`⚠️ Text truncated to ${opts.maxTextLength} characters`);
      }

      const processingTimeMs = Date.now() - startTime;
      const wordCount = extractedText.trim().split(/\s+/).filter(w => w.length > 0).length;

      log.info('✅ Text extraction complete', {
        wordCount,
        processingTimeMs,
      });

      return {
        success: true,
        extractedText,
        wordCount,
        fileType: 'text',
        processingTimeMs,
      };
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      log.error('❌ Text extraction failed:', { error: errorMessage });
      
      return {
        success: false,
        extractedText: '',
        wordCount: 0,
        fileType: 'text',
        error: errorMessage,
        processingTimeMs,
      };
    }
  }

  /**
   * Extract text from any supported file type
   * Auto-detects the file type and uses the appropriate extraction method
   * 
   * @param fileData - Buffer, base64 string, or URL of the file
   * @param fileType - Explicit file type (optional, will be detected if not provided)
   * @param mimeType - MIME type for type detection (optional)
   * @param fileName - File name for type detection (optional)
   * @param options - Extraction options
   */
  public async extractText(
    fileData: Buffer | string,
    fileType?: ExtractableFileType,
    mimeType?: string,
    fileName?: string,
    options: ExtractionOptions = {}
  ): Promise<TextExtractionResult> {
    // Detect file type if not provided
    const detectedType = fileType || this.detectFileType(mimeType, fileName);
    
    if (!detectedType) {
      log.error('❌ Unable to detect file type', { mimeType, fileName });
      return {
        success: false,
        extractedText: '',
        wordCount: 0,
        fileType: 'text',
        error: 'Unable to detect file type. Please specify the file type.',
        processingTimeMs: 0,
      };
    }

    log.info(`📂 Extracting text from ${detectedType} file...`);

    switch (detectedType) {
      case 'image':
        return this.extractTextFromImage(fileData, options);
      case 'pdf':
        return this.extractTextFromPdf(fileData, options);
      case 'text':
        return this.extractTextFromTextFile(fileData, options);
      default:
        return {
          success: false,
          extractedText: '',
          wordCount: 0,
          fileType: detectedType,
          error: `Unsupported file type: ${detectedType}`,
          processingTimeMs: 0,
        };
    }
  }

  /**
   * Clean up resources (terminate OCR worker)
   */
  public async cleanup(): Promise<void> {
    if (this.ocrWorker) {
      log.info('🧹 Cleaning up OCR worker...');
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
      this.isWorkerReady = false;
      log.info('✅ OCR worker terminated');
    }
  }
}

// Export singleton instance
export const fileExtractorService = new FileExtractorService();

export default FileExtractorService;
