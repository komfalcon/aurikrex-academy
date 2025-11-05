import { storage } from '../config/firebase.js';
import { getErrorMessage } from '../utils/errors.js';
import { log } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
class StorageError extends AppError {
    constructor(message, code, options) {
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
export class StorageService {
    bucket = storage.bucket();
    /**
     * Uploads a file to Firebase Storage
     */
    async uploadFile(folder, fileName, fileBuffer, options) {
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
        }
        catch (error) {
            console.error('Error uploading file:', getErrorMessage(error));
            throw error;
        }
    }
    /**
     * Deletes a file from Firebase Storage
     */
    async deleteFile(filePath) {
        try {
            await this.bucket.file(filePath).delete();
            console.log(`✅ File deleted successfully: ${filePath}`);
        }
        catch (error) {
            console.error('Error deleting file:', getErrorMessage(error));
            throw error;
        }
    }
    /**
     * Gets a signed URL for a file
     */
    async getSignedUrl(filePath, expirationHours = 24) {
        try {
            const [signedUrl] = await this.bucket.file(filePath).getSignedUrl({
                action: 'read',
                expires: Date.now() + expirationHours * 60 * 60 * 1000
            });
            return signedUrl;
        }
        catch (error) {
            console.error('Error getting signed URL:', getErrorMessage(error));
            throw error;
        }
    }
    /**
     * Lists all files in a folder
     */
    async listFiles(folderPath) {
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
        }
        catch (error) {
            log.error('Error listing files:', {
                error: getErrorMessage(error),
                folderPath
            });
            throw new StorageError('Failed to list files', 'STORAGE_LIST_ERROR', { cause: error, details: { folderPath } });
        }
    }
    /**
     * Moves a file to a new location
     */
    async moveFile(sourcePath, destinationPath) {
        try {
            const sourceFile = this.bucket.file(sourcePath);
            const exists = await sourceFile.exists().then(([exists]) => exists);
            if (!exists) {
                throw new StorageError('Source file does not exist', 'FILE_NOT_FOUND', { details: { sourcePath } });
            }
            await sourceFile.move(destinationPath);
            log.info('File moved successfully', {
                sourcePath,
                destinationPath
            });
        }
        catch (error) {
            log.error('Error moving file:', {
                error: getErrorMessage(error),
                sourcePath,
                destinationPath
            });
            if (error instanceof StorageError) {
                throw error;
            }
            throw new StorageError('Failed to move file', 'STORAGE_MOVE_ERROR', { cause: error, details: { sourcePath, destinationPath } });
        }
    }
    /**
     * Copies a file to a new location
     */
    async copyFile(sourcePath, destinationPath) {
        try {
            await this.bucket.file(sourcePath).copy(destinationPath);
            console.log(`✅ File copied successfully: ${sourcePath} -> ${destinationPath}`);
        }
        catch (error) {
            console.error('Error copying file:', getErrorMessage(error));
            throw error;
        }
    }
    /**
     * Downloads a file from Firebase Storage
     */
    async downloadFile(filePath) {
        try {
            const [fileContents] = await this.bucket.file(filePath).download();
            return fileContents;
        }
        catch (error) {
            console.error('Error downloading file:', getErrorMessage(error));
            throw error;
        }
    }
    /**
     * Gets metadata for a file
     */
    async getFileMetadata(filePath) {
        try {
            const [metadata] = await this.bucket.file(filePath).getMetadata();
            return metadata;
        }
        catch (error) {
            console.error('Error getting file metadata:', getErrorMessage(error));
            throw error;
        }
    }
}
// Export a singleton instance
export const storageService = new StorageService();
//# sourceMappingURL=StorageService.js.map