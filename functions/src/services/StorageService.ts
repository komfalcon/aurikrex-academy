import { storage } from '../config/firebase';
import { getErrorMessage } from '../utils/errors';
import { log } from '../utils/logger';
import { AppError } from '../utils/errors';

class StorageError extends AppError {
  constructor(
    message: string,
    code: string,
    options?: { cause?: unknown; details?: unknown }
  ) {
    super(message, {
      code,
      status: 500,
      cause: options?.cause,
      details: options?.details
    });
    this.name = 'StorageError';
  }
}
import { randomUUID } from 'crypto';

export interface UploadOptions {
  contentType?: string;
  metadata?: {
    [key: string]: string;
  };
}

export class StorageService {
  private readonly bucket = storage.bucket();

  /**
   * Uploads a file to Firebase Storage
   */
  public async uploadFile(
    folder: string,
    fileName: string,
    fileBuffer: Buffer,
    options?: UploadOptions
  ): Promise<string> {
    try {
      const uniqueFileName = `${randomUUID()}-${fileName}`;
      const filePath = `${folder}/${uniqueFileName}`;
      const file = this.bucket.file(filePath);

      await file.save(fileBuffer, {
        contentType: options?.contentType,
        metadata: options?.metadata,
        validation: 'md5'
      });

      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      console.log(`✅ File uploaded successfully: ${filePath}`);
      return signedUrl;
    } catch (error) {
      console.error('Error uploading file:', getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Deletes a file from Firebase Storage
   */
  public async deleteFile(filePath: string): Promise<void> {
    try {
      await this.bucket.file(filePath).delete();
      console.log(`✅ File deleted successfully: ${filePath}`);
    } catch (error) {
      console.error('Error deleting file:', getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Gets a signed URL for a file
   */
  public async getSignedUrl(filePath: string, expirationHours = 24): Promise<string> {
    try {
      const [signedUrl] = await this.bucket.file(filePath).getSignedUrl({
        action: 'read',
        expires: Date.now() + expirationHours * 60 * 60 * 1000
      });
      return signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Lists all files in a folder
   */
  public async listFiles(folderPath: string): Promise<string[]> {
    try {
      const [files] = await this.bucket.getFiles({
        prefix: folderPath,
        autoPaginate: true
      });
      
      if (!files || files.length === 0) {
        log.info('No files found in folder', { folderPath });
        return [];
      }

      return files.map(file => file.name);
    } catch (error) {
      log.error('Error listing files:', {
        error: getErrorMessage(error),
        folderPath
      });
      throw new StorageError(
        'Failed to list files',
        'STORAGE_LIST_ERROR',
        { cause: error, details: { folderPath } }
      );
    }
  }

  /**
   * Moves a file to a new location
   */
  public async moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      const sourceFile = this.bucket.file(sourcePath);
      const exists = await sourceFile.exists().then(([exists]) => exists);
      
      if (!exists) {
        throw new StorageError(
          'Source file does not exist',
          'FILE_NOT_FOUND',
          { details: { sourcePath } }
        );
      }

      await sourceFile.move(destinationPath);
      log.info('File moved successfully', {
        sourcePath,
        destinationPath
      });
    } catch (error) {
      log.error('Error moving file:', {
        error: getErrorMessage(error),
        sourcePath,
        destinationPath
      });

      if (error instanceof StorageError) {
        throw error;
      }

      throw new StorageError(
        'Failed to move file',
        'STORAGE_MOVE_ERROR',
        { cause: error, details: { sourcePath, destinationPath } }
      );
    }
  }

  /**
   * Copies a file to a new location
   */
  public async copyFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      await this.bucket.file(sourcePath).copy(destinationPath);
      console.log(`✅ File copied successfully: ${sourcePath} -> ${destinationPath}`);
    } catch (error) {
      console.error('Error copying file:', getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Downloads a file from Firebase Storage
   */
  public async downloadFile(filePath: string): Promise<Buffer> {
    try {
      const [fileContents] = await this.bucket.file(filePath).download();
      return fileContents;
    } catch (error) {
      console.error('Error downloading file:', getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Gets metadata for a file
   */
  public async getFileMetadata(filePath: string): Promise<{ [key: string]: any }> {
    try {
      const [metadata] = await this.bucket.file(filePath).getMetadata();
      return metadata;
    } catch (error) {
      console.error('Error getting file metadata:', getErrorMessage(error));
      throw error;
    }
  }
}

// Export a singleton instance
export const storageService = new StorageService();