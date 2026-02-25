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
 * @openapi
 * /media/upload/image:
 *   post:
 *     tags: [Media]
 *     summary: Upload a single image
 *     description: Upload a cover, screenshot, or other image file.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               entity_type:
 *                 type: string
 *                 example: game
 *               entity_id:
 *                 type: integer
 *                 example: 42
 *     responses:
 *       201:
 *         description: Image uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 media:
 *                   $ref: '#/components/schemas/Media'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
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
 * @openapi
 * /media/upload/images:
 *   post:
 *     tags: [Media]
 *     summary: Upload multiple images
 *     description: Upload up to 10 images at once.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [images]
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *     responses:
 *       201:
 *         description: Images uploaded
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
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
 * @openapi
 * /media/upload/avatar:
 *   post:
 *     tags: [Media]
 *     summary: Upload or replace user avatar
 *     description: Max 2 MB. Replaces the existing avatar if present.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
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
 * @openapi
 * /media/upload/video:
 *   post:
 *     tags: [Media]
 *     summary: Upload a video / trailer
 *     description: Max 100 MB.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [video]
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Video uploaded
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
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
 * @openapi
 * /media/upload/document:
 *   post:
 *     tags: [Media]
 *     summary: Upload a document / PDF
 *     description: Max 20 MB.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [document]
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
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
 * @openapi
 * /media/my-uploads:
 *   get:
 *     tags: [Media]
 *     summary: List current user's uploads
 *     description: Paginated list of files uploaded by the authenticated user.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: User's uploaded media
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 media:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Media'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/my-uploads', generalLimiter, authenticate, myUploads);

/**
 * @openapi
 * /media/stats:
 *   get:
 *     tags: [Media]
 *     summary: Get upload stats
 *     description: Returns upload count and total size for the current user.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Media stats
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/stats', generalLimiter, authenticate, mediaStats);

/**
 * @openapi
 * /media/entity/{entityType}/{entityId}:
 *   get:
 *     tags: [Media]
 *     summary: List media for an entity
 *     description: Returns all media for a given entity (game, user, review, etc.). Private assets are filtered.
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [game, user, review]
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Entity media list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 media:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Media'
 */
router.get('/entity/:entityType/:entityId', generalLimiter, optionalAuth, listEntityMedia);

/**
 * @openapi
 * /media/{id}:
 *   get:
 *     tags: [Media]
 *     summary: Get a media item
 *     description: Returns a single media item including signed URL if applicable.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Media item detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 media:
 *                   $ref: '#/components/schemas/Media'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Media]
 *     summary: Delete a media item
 *     description: Deletes the media item and its storage files. Owner or admin only.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Media deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', generalLimiter, optionalAuth, getMedia);

/**
 * @openapi
 * /media/{id}/url:
 *   get:
 *     tags: [Media]
 *     summary: Get signed URL for a media item
 *     description: Returns a signed URL or redirects to the file.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Signed URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 url:
 *                   type: string
 *                   format: uri
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/url', generalLimiter, optionalAuth, getMediaUrl);

// ─── Update / Replace ────────────────────────────────────────────────

/**
 * @openapi
 * /media/{id}/replace:
 *   put:
 *     tags: [Media]
 *     summary: Replace a media item with a new file
 *     description: Versioned replacement. Owner or admin only.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Media replaced
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
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

router.delete('/:id', generalLimiter, authenticate, removeMedia);

export default router;
