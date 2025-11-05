export interface UploadOptions {
    contentType?: string;
    metadata?: {
        [key: string]: string;
    };
}
export declare class StorageService {
    private readonly bucket;
    /**
     * Uploads a file to Firebase Storage
     */
    uploadFile(folder: string, fileName: string, fileBuffer: Buffer, options?: UploadOptions): Promise<string>;
    /**
     * Deletes a file from Firebase Storage
     */
    deleteFile(filePath: string): Promise<void>;
    /**
     * Gets a signed URL for a file
     */
    getSignedUrl(filePath: string, expirationHours?: number): Promise<string>;
    /**
     * Lists all files in a folder
     */
    listFiles(folderPath: string): Promise<string[]>;
    /**
     * Moves a file to a new location
     */
    moveFile(sourcePath: string, destinationPath: string): Promise<void>;
    /**
     * Copies a file to a new location
     */
    copyFile(sourcePath: string, destinationPath: string): Promise<void>;
    /**
     * Downloads a file from Firebase Storage
     */
    downloadFile(filePath: string): Promise<Buffer>;
    /**
     * Gets metadata for a file
     */
    getFileMetadata(filePath: string): Promise<{
        [key: string]: any;
    }>;
}
export declare const storageService: StorageService;
