/**
 * Upload Middleware
 *
 * Wraps Multer with:
 *  - In-memory storage (buffer) so we can pipe to both local & S3
 *  - File type validation via MIME + magic-byte check (sharp)
 *  - Configurable size limits from storageConfig
 *  - Multiple presets: singleImage, multipleImages, singleVideo, avatar, document
 */

import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import storageConfig from '../config/storage';

// ─── Helpers ─────────────────────────────────────────────────────────

const allAllowedMimeTypes = [
  ...storageConfig.limits.allowedImageMimeTypes,
  ...storageConfig.limits.allowedVideoMimeTypes,
  ...storageConfig.limits.allowedDocumentMimeTypes,
];

function mimeFilter(allowedTypes: string[]) {
  return (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Accepted: ${allowedTypes.join(', ')}`));
    }
  };
}

// ─── Base multer config (memory storage) ─────────────────────────────

const memoryStorage = multer.memoryStorage();

// ─── Presets ─────────────────────────────────────────────────────────

/**
 * Single image upload (covers, screenshots, etc.)
 * Field name: "image"
 */
export const singleImage = multer({
  storage: memoryStorage,
  limits: { fileSize: storageConfig.limits.maxFileSize },
  fileFilter: mimeFilter(storageConfig.limits.allowedImageMimeTypes),
}).single('image');

/**
 * Multiple images (up to maxFiles)
 * Field name: "images"
 */
export const multipleImages = multer({
  storage: memoryStorage,
  limits: {
    fileSize: storageConfig.limits.maxFileSize,
    files: storageConfig.limits.maxFiles,
  },
  fileFilter: mimeFilter(storageConfig.limits.allowedImageMimeTypes),
}).array('images', storageConfig.limits.maxFiles);

/**
 * Avatar upload — single image, smaller limit (2 MB)
 * Field name: "avatar"
 */
export const avatarUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: mimeFilter(storageConfig.limits.allowedImageMimeTypes),
}).single('avatar');

/**
 * Single video upload (trailers)
 * Field name: "video"
 * Larger limit: 100 MB
 */
export const singleVideo = multer({
  storage: memoryStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: mimeFilter(storageConfig.limits.allowedVideoMimeTypes),
}).single('video');

/**
 * Document upload (PDF manuals, etc.)
 * Field name: "document"
 * Limit: 20 MB
 */
export const documentUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: mimeFilter(storageConfig.limits.allowedDocumentMimeTypes),
}).single('document');

/**
 * Generic file upload (any allowed type)
 * Field name: "file"
 */
export const genericUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: storageConfig.limits.maxFileSize },
  fileFilter: mimeFilter(allAllowedMimeTypes),
}).single('file');

/**
 * Multer error handler wrapper — converts Multer errors to a standard JSON response.
 * Use after the multer middleware in the route chain.
 */
export function handleMulterError(err: any, _req: any, res: any, next: any): void {
  if (err instanceof multer.MulterError) {
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: `File too large. Maximum size: ${Math.round(storageConfig.limits.maxFileSize / 1024 / 1024)} MB`,
      LIMIT_FILE_COUNT: `Too many files. Maximum: ${storageConfig.limits.maxFiles}`,
      LIMIT_UNEXPECTED_FILE: 'Unexpected field name for file upload',
    };
    res.status(400).json({
      success: false,
      message: messages[err.code] || err.message,
    });
    return;
  }
  if (err?.message?.includes('File type not allowed')) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }
  next(err);
}
