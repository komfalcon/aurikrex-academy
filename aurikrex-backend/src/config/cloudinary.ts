/**
 * Cloudinary Configuration
 * 
 * Configures Cloudinary SDK for secure file uploads.
 * All book files (PDF, EPUB, PPTX) are uploaded to Cloudinary for CDN distribution.
 */

import { v2 as cloudinary, ConfigOptions, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { log } from '../utils/logger.js';

// Cloudinary configuration options
export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

// Configuration state
let isConfigured = false;

/**
 * Initialize Cloudinary with credentials
 * Should be called once during server startup
 */
export function initCloudinary(): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    log.warn('⚠️ Cloudinary credentials not configured. File uploads will use fallback storage.');
    return false;
  }

  const config: ConfigOptions = {
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  };

  cloudinary.config(config);
  isConfigured = true;
  log.info('✅ Cloudinary configured successfully');
  return true;
}

/**
 * Check if Cloudinary is configured and ready
 */
export function isCloudinaryConfigured(): boolean {
  return isConfigured;
}

/**
 * Generate a signed upload URL for direct browser uploads
 * This allows secure uploads without exposing API credentials
 */
export function generateSignedUploadParams(folder: string, publicId: string): {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  publicId: string;
} | null {
  if (!isConfigured) {
    return null;
  }

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = {
    folder,
    public_id: publicId,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET || ''
  );

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    folder,
    publicId,
  };
}

/**
 * Upload a file buffer to Cloudinary
 * Used for server-side uploads
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder: string;
    publicId?: string;
    resourceType?: 'auto' | 'image' | 'video' | 'raw';
    format?: string;
  }
): Promise<UploadApiResponse | null> {
  if (!isConfigured) {
    log.warn('⚠️ Cloudinary not configured. Cannot upload file.');
    return null;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.publicId,
        resource_type: options.resourceType || 'auto',
        format: options.format,
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          log.error('❌ Cloudinary upload failed', { error: error.message });
          reject(error);
        } else if (result) {
          log.info('✅ Cloudinary upload successful', { 
            publicId: result.public_id,
            url: result.secure_url 
          });
          resolve(result);
        } else {
          reject(new Error('No result from Cloudinary upload'));
        }
      }
    );

    // Write buffer to upload stream
    uploadStream.end(buffer);
  });
}

/**
 * Upload a file from base64 data URL to Cloudinary
 */
export async function uploadBase64ToCloudinary(
  base64Data: string,
  options: {
    folder: string;
    publicId?: string;
    resourceType?: 'auto' | 'image' | 'video' | 'raw';
  }
): Promise<UploadApiResponse | null> {
  if (!isConfigured) {
    log.warn('⚠️ Cloudinary not configured. Cannot upload file.');
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: options.folder,
      public_id: options.publicId,
      resource_type: options.resourceType || 'auto',
    });

    log.info('✅ Cloudinary base64 upload successful', { 
      publicId: result.public_id,
      url: result.secure_url 
    });

    return result;
  } catch (error) {
    log.error('❌ Cloudinary base64 upload failed', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return null;
  }
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'raw'
): Promise<boolean> {
  if (!isConfigured) {
    return false;
  }

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    log.info('✅ Cloudinary file deleted', { publicId });
    return true;
  } catch (error) {
    log.error('❌ Cloudinary delete failed', { 
      error: error instanceof Error ? error.message : String(error),
      publicId 
    });
    return false;
  }
}

/**
 * Generate a transformation URL for a cover image
 * Used to create thumbnail previews from PDFs
 */
export function generateCoverUrl(publicId: string, options?: {
  width?: number;
  height?: number;
  format?: string;
  page?: number;
}): string {
  if (!isConfigured) {
    return '';
  }

  const transformations: string[] = [];
  
  if (options?.width) {
    transformations.push(`w_${options.width}`);
  }
  if (options?.height) {
    transformations.push(`h_${options.height}`);
  }
  if (options?.page) {
    transformations.push(`pg_${options.page}`);
  }
  if (options?.format) {
    transformations.push(`f_${options.format}`);
  } else {
    transformations.push('f_jpg');
  }

  // Add quality optimization
  transformations.push('q_auto');
  transformations.push('c_fill');

  return cloudinary.url(publicId, {
    transformation: transformations.join(','),
    secure: true,
  });
}

// Export the cloudinary instance for direct access if needed
export { cloudinary };
