import path from 'path';
import { log } from '../utils/logger.js';
import type { BookFileType } from '../models/Book.model.js';
import { 
  isCloudinaryConfigured, 
  uploadToCloudinary, 
  uploadBase64ToCloudinary,
  deleteFromCloudinary,
  generateSignedUploadParams 
} from '../config/cloudinary.js';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  fileType: BookFileType;
  publicId?: string;
}

// Restricted file types per requirements (PDF, EPUB, PPTX only)
const ALLOWED_FILE_TYPES: BookFileType[] = ['pdf', 'epub', 'pptx'];
const ALLOWED_MIME_TYPES: Record<string, BookFileType> = {
  'application/pdf': 'pdf',
  'application/epub+zip': 'epub',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
};

// 100MB max file size as per requirements
const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * FileUploadService
 * 
 * Handles secure file validation and upload to Cloudinary.
 * Only accepts PDF, EPUB, and PPTX files up to 100MB.
 * Provides Cloudinary integration with fallback for development.
 */
class FileUploadService {
  /**
   * Validate file before upload
   * Enforces file type and size restrictions
   */
  validateFile(file: UploadedFile): FileValidationResult {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    // Check file size (100MB limit)
    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` 
      };
    }

    // Check file type by MIME type
    const fileType = ALLOWED_MIME_TYPES[file.mimetype];
    if (!fileType) {
      return {
        valid: false,
        error: `Invalid file type. Only PDF, EPUB, and PPTX files are allowed.`
      };
    }

    // Double-check by extension
    const ext = this.getFileExtension(file.originalname);
    if (!ALLOWED_FILE_TYPES.includes(ext as BookFileType)) {
      return {
        valid: false,
        error: `Invalid file extension. Only .pdf, .epub, and .pptx files are allowed.`
      };
    }

    return { valid: true };
  }

  /**
   * Validate file by MIME type string and size
   * Used for frontend validation before upload
   */
  validateByMimeType(mimeType: string, fileSize: number): FileValidationResult {
    if (fileSize > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` 
      };
    }

    if (!ALLOWED_MIME_TYPES[mimeType]) {
      return {
        valid: false,
        error: `Invalid file type. Only PDF, EPUB, and PPTX files are allowed.`
      };
    }

    return { valid: true };
  }

  /**
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase().slice(1);
  }

  /**
   * Check if file type is allowed
   */
  isAllowedType(ext: string): ext is BookFileType {
    return ALLOWED_FILE_TYPES.includes(ext as BookFileType);
  }

  /**
   * Get file type from extension
   */
  getFileType(filename: string): BookFileType | null {
    const ext = this.getFileExtension(filename);
    if (this.isAllowedType(ext)) {
      return ext;
    }
    return null;
  }

  /**
   * Get file type from MIME type
   */
  getFileTypeFromMime(mimeType: string): BookFileType | null {
    return ALLOWED_MIME_TYPES[mimeType] || null;
  }

  /**
   * Upload file buffer to Cloudinary
   * Falls back to placeholder URL in development without Cloudinary config
   */
  async uploadFile(file: UploadedFile, folder: string = 'books'): Promise<UploadResult> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const fileType = this.getFileType(file.originalname);
    if (!fileType) {
      throw new Error('Invalid file type');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.+/g, '.')
      .toLowerCase();
    const publicId = `${timestamp}-${sanitizedName.replace(/\.[^/.]+$/, '')}`;

    // Try Cloudinary upload first
    if (isCloudinaryConfigured()) {
      try {
        const result = await uploadToCloudinary(file.buffer, {
          folder: `aurikrex/${folder}`,
          publicId,
          resourceType: 'raw', // Raw for documents (PDF, EPUB, PPTX)
        });

        if (result) {
          log.info('✅ File uploaded to Cloudinary', {
            fileName: file.originalname,
            fileType,
            fileSize: file.size,
            url: result.secure_url
          });

          return {
            url: result.secure_url,
            fileName: file.originalname,
            fileSize: file.size,
            fileType,
            publicId: result.public_id,
          };
        }
      } catch (error) {
        log.error('❌ Cloudinary upload failed, using fallback', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    // Fallback: Generate placeholder URL for development
    const fallbackUrl = `/uploads/${folder}/${timestamp}-${sanitizedName}`;
    
    log.warn('⚠️ File upload using fallback (Cloudinary not configured)', {
      fileName: file.originalname,
      fileType,
      fileSize: file.size,
      fallbackUrl
    });

    return {
      url: fallbackUrl,
      fileName: file.originalname,
      fileSize: file.size,
      fileType,
    };
  }

  /**
   * Upload file from base64 data URL
   * Handles frontend file uploads that send base64 encoded data
   */
  async uploadBase64File(
    base64Data: string,
    filename: string,
    mimeType: string,
    folder: string = 'books'
  ): Promise<UploadResult> {
    const fileType = this.getFileTypeFromMime(mimeType);
    if (!fileType) {
      throw new Error('Invalid file type. Only PDF, EPUB, and PPTX files are allowed.');
    }

    // Extract actual base64 data (remove data:xxx;base64, prefix if present)
    const base64Match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    const actualBase64 = base64Match ? base64Match[2] : base64Data;
    
    // Calculate approximate file size from base64
    const fileSize = Math.round((actualBase64.length * 3) / 4);
    
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.+/g, '.')
      .toLowerCase();
    const publicId = `${timestamp}-${sanitizedName.replace(/\.[^/.]+$/, '')}`;

    // Try Cloudinary upload first
    if (isCloudinaryConfigured()) {
      try {
        const result = await uploadBase64ToCloudinary(base64Data, {
          folder: `aurikrex/${folder}`,
          publicId,
          resourceType: 'raw',
        });

        if (result) {
          log.info('✅ Base64 file uploaded to Cloudinary', {
            fileName: filename,
            fileType,
            fileSize,
            url: result.secure_url
          });

          return {
            url: result.secure_url,
            fileName: filename,
            fileSize,
            fileType,
            publicId: result.public_id,
          };
        }
      } catch (error) {
        log.error('❌ Cloudinary base64 upload failed, using fallback', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    // Fallback: Generate placeholder URL for development
    const fallbackUrl = `/uploads/${folder}/${timestamp}-${sanitizedName}`;
    
    log.warn('⚠️ Base64 file upload using fallback (Cloudinary not configured)', {
      fileName: filename,
      fileType,
      fileSize,
      fallbackUrl
    });

    return {
      url: fallbackUrl,
      fileName: filename,
      fileSize,
      fileType,
    };
  }

  /**
   * Delete file from storage
   */
  async deleteFile(publicId: string): Promise<boolean> {
    if (!publicId) {
      return false;
    }

    if (isCloudinaryConfigured()) {
      return deleteFromCloudinary(publicId, 'raw');
    }

    log.info('🗑️ File marked for deletion (placeholder)', { publicId });
    return true;
  }

  /**
   * Generate signed upload parameters for direct browser upload
   * Returns null if Cloudinary is not configured
   */
  getSignedUploadParams(folder: string = 'books'): ReturnType<typeof generateSignedUploadParams> {
    const timestamp = Date.now();
    const publicId = `${timestamp}-upload`;
    return generateSignedUploadParams(`aurikrex/${folder}`, publicId);
  }

  /**
   * Get allowed file types
   */
  getAllowedTypes(): string[] {
    return [...ALLOWED_FILE_TYPES];
  }

  /**
   * Get allowed MIME types
   */
  getAllowedMimeTypes(): string[] {
    return Object.keys(ALLOWED_MIME_TYPES);
  }

  /**
   * Get max file size in bytes
   */
  getMaxFileSize(): number {
    return MAX_FILE_SIZE;
  }

  /**
   * Get max file size formatted
   */
  getMaxFileSizeFormatted(): string {
    return `${MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }
}

export default new FileUploadService();

