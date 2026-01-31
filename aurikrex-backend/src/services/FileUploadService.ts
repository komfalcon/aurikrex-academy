import path from 'path';
import { log } from '../utils/logger.js';
import type { BookFileType } from '../models/Book.model.js';

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
}

/**
 * FileUploadService
 * Handles file validation and upload preparation
 * Note: Actual cloud storage upload (Cloudinary/S3) would be implemented here
 *       For now, this provides validation and mock URL generation
 */
class FileUploadService {
  private readonly ALLOWED_TYPES: BookFileType[] = ['pdf', 'epub', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'png', 'jpg'];
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  /**
   * Validate file before upload
   */
  validateFile(file: UploadedFile): FileValidationResult {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File too large. Maximum 100MB allowed.' };
    }

    const ext = this.getFileExtension(file.originalname);
    if (!this.isAllowedType(ext)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${this.ALLOWED_TYPES.join(', ')}`
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
    return this.ALLOWED_TYPES.includes(ext as BookFileType);
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
   * Upload file to storage
   * Note: This is a placeholder implementation
   * In production, this would upload to Cloudinary, S3, or another cloud storage
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

    // Generate a unique filename
    const timestamp = Date.now();
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.+/g, '.')
      .toLowerCase();
    
    // PLACEHOLDER: This generates a local path URL for development.
    // In production, replace this with actual cloud storage integration:
    // - Cloudinary: cloudinary.v2.uploader.upload_stream(...)
    // - AWS S3: s3.upload({ Bucket, Key, Body: file.buffer })
    // - Azure Blob: blobServiceClient.getContainerClient(...).uploadData(file.buffer)
    const url = `/uploads/${folder}/${timestamp}-${sanitizedName}`;

    log.info('📁 File prepared for upload (placeholder URL - requires cloud storage integration)', {
      fileName: file.originalname,
      fileType,
      fileSize: file.size,
      folder
    });

    return {
      url,
      fileName: file.originalname,
      fileSize: file.size,
      fileType
    };
  }

  /**
   * Delete file from storage
   * Note: This is a placeholder implementation
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // In production, this would delete from Cloudinary/S3
      log.info('🗑️ File marked for deletion', { fileUrl });
    } catch (error) {
      log.error('❌ Failed to delete file', { 
        error: error instanceof Error ? error.message : String(error),
        fileUrl 
      });
    }
  }

  /**
   * Get allowed file types
   */
  getAllowedTypes(): string[] {
    return [...this.ALLOWED_TYPES];
  }

  /**
   * Get max file size in bytes
   */
  getMaxFileSize(): number {
    return this.MAX_FILE_SIZE;
  }

  /**
   * Get max file size formatted
   */
  getMaxFileSizeFormatted(): string {
    return `${this.MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }
}

export default new FileUploadService();
