/**
 * Storage Configuration
 *
 * Controls where uploaded media is stored (local filesystem or AWS S3)
 * and sets limits for file size, allowed types, etc.
 *
 * Environment variables:
 *   STORAGE_PROVIDER     — "local" | "s3"  (default: "local")
 *   STORAGE_LOCAL_PATH   — absolute path for local uploads (default: ./uploads)
 *   AWS_S3_BUCKET        — S3 bucket name
 *   AWS_S3_REGION        — S3 region (default: us-east-1)
 *   AWS_ACCESS_KEY_ID    — IAM key
 *   AWS_SECRET_ACCESS_KEY— IAM secret
 *   SIGNED_URL_EXPIRES   — seconds for pre-signed URL expiry (default: 3600)
 */

import path from 'path';

export type StorageProviderType = 'local' | 's3';

export interface StorageConfig {
  provider: StorageProviderType;
  local: {
    uploadDir: string;
    serveBase: string;       // URL base for serving local files
  };
  s3: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    signedUrlExpires: number; // seconds
  };
  limits: {
    maxFileSize: number;      // bytes
    maxFiles: number;
    allowedImageMimeTypes: string[];
    allowedVideoMimeTypes: string[];
    allowedDocumentMimeTypes: string[];
    thumbnailSizes: { width: number; height: number; suffix: string }[];
  };
}

const storageConfig: StorageConfig = {
  provider: (process.env.STORAGE_PROVIDER as StorageProviderType) || 'local',

  local: {
    uploadDir: process.env.STORAGE_LOCAL_PATH || path.resolve(process.cwd(), 'uploads'),
    serveBase: process.env.STORAGE_LOCAL_SERVE_BASE || '/uploads',
  },

  s3: {
    bucket: process.env.AWS_S3_BUCKET || '',
    region: process.env.AWS_S3_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    signedUrlExpires: parseInt(process.env.SIGNED_URL_EXPIRES || '3600', 10),
  },

  limits: {
    maxFileSize: parseInt(process.env.MAX_UPLOAD_SIZE || String(10 * 1024 * 1024), 10), // 10 MB
    maxFiles: 10,
    allowedImageMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
    ],
    allowedVideoMimeTypes: [
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ],
    allowedDocumentMimeTypes: [
      'application/pdf',
    ],
    thumbnailSizes: [
      { width: 150,  height: 150,  suffix: 'thumb' },
      { width: 400,  height: 400,  suffix: 'medium' },
      { width: 800,  height: 800,  suffix: 'large' },
    ],
  },
};

export default storageConfig;
