import { Router } from 'express';
import {
  uploadImage,
  uploadImages,
  uploadAvatar,
  uploadVideo,
  uploadDocument,
  getMedia,
  getMediaUrl,
  listEntityMedia,
  myUploads,
  mediaStats,
  removeMedia,
  replaceMediaItem,
} from '../controllers/mediaController';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { generalLimiter, createLimiter } from '../middlewares/rateLimiter';
import {
  singleImage,
  multipleImages,
  avatarUpload,
  singleVideo,
  documentUpload,
  handleMulterError,
} from '../middlewares/upload';

const router = Router();

// ─── Upload endpoints ────────────────────────────────────────────────

/**
 * @route POST /api/media/upload/image
 * @desc Upload a single image (cover, screenshot, etc.)
 * @access Private
 */
router.post(
  '/upload/image',
  createLimiter,
  authenticate,
  singleImage,
  handleMulterError,
  uploadImage,
);

/**
 * @route POST /api/media/upload/images
 * @desc Upload multiple images at once (max 10)
 * @access Private
 */
router.post(
  '/upload/images',
  createLimiter,
  authenticate,
  multipleImages,
  handleMulterError,
  uploadImages,
);

/**
 * @route POST /api/media/upload/avatar
 * @desc Upload or replace user avatar (max 2 MB)
 * @access Private
 */
router.post(
  '/upload/avatar',
  createLimiter,
  authenticate,
  avatarUpload,
  handleMulterError,
  uploadAvatar,
);

/**
 * @route POST /api/media/upload/video
 * @desc Upload a video / trailer (max 100 MB)
 * @access Private
 */
router.post(
  '/upload/video',
  createLimiter,
  authenticate,
  singleVideo,
  handleMulterError,
  uploadVideo,
);

/**
 * @route POST /api/media/upload/document
 * @desc Upload a document / PDF (max 20 MB)
 * @access Private
 */
router.post(
  '/upload/document',
  createLimiter,
  authenticate,
  documentUpload,
  handleMulterError,
  uploadDocument,
);

// ─── Read / List endpoints ───────────────────────────────────────────

/**
 * @route GET /api/media/my-uploads
 * @desc List current user's uploaded media (paginated)
 * @access Private
 */
router.get('/my-uploads', generalLimiter, authenticate, myUploads);

/**
 * @route GET /api/media/stats
 * @desc Get upload stats for the current user
 * @access Private
 */
router.get('/stats', generalLimiter, authenticate, mediaStats);

/**
 * @route GET /api/media/entity/:entityType/:entityId
 * @desc List all media for a given entity (game, user, review, etc.)
 * @access Public (private assets filtered server-side)
 */
router.get('/entity/:entityType/:entityId', generalLimiter, optionalAuth, listEntityMedia);

/**
 * @route GET /api/media/:id
 * @desc Get a single media item by ID (includes signed URL)
 * @access Public / Private (respects is_public flag)
 */
router.get('/:id', generalLimiter, optionalAuth, getMedia);

/**
 * @route GET /api/media/:id/url
 * @desc Get a signed URL for a media item (or redirect)
 * @access Public / Private
 */
router.get('/:id/url', generalLimiter, optionalAuth, getMediaUrl);

// ─── Update / Replace ────────────────────────────────────────────────

/**
 * @route PUT /api/media/:id/replace
 * @desc Replace a media item with a new file (versioned)
 * @access Private (owner or admin)
 */
router.put(
  '/:id/replace',
  createLimiter,
  authenticate,
  singleImage,
  handleMulterError,
  replaceMediaItem,
);

// ─── Delete ──────────────────────────────────────────────────────────

/**
 * @route DELETE /api/media/:id
 * @desc Delete a media item and its storage files
 * @access Private (owner or admin)
 */
router.delete('/:id', generalLimiter, authenticate, removeMedia);

export default router;
