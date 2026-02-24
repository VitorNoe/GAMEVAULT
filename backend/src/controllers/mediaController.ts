import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import {
  uploadMedia,
  uploadMultipleMedia,
  getMediaById,
  getMediaForEntity,
  deleteMedia,
  replaceMedia,
  getUserMediaStats,
  UploadOptions,
} from '../services/mediaService';
import { getSignedUrl } from '../services/storageProvider';
import storageConfig from '../config/storage';
import {
  getPaginationParams,
  getPaginationResult,
  parseId,
  successResponse,
  errorResponse,
} from '../utils/helpers';
import Media from '../models/Media';

// ─── Single image upload ─────────────────────────────────────────────

/**
 * Upload a single image.
 * POST /api/media/upload/image
 * Form field: "image"
 * Query/Body: category, entity_type, entity_id, is_public, optimize
 */
export const uploadImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json(errorResponse('Not authenticated')); return; }

    const file = req.file;
    if (!file) { res.status(400).json(errorResponse('No image file provided')); return; }

    const opts = buildUploadOptions(req, userId);
    const media = await uploadMedia(file.buffer, file.originalname, file.mimetype, opts);
    const result = await getMediaById(media.id);

    res.status(201).json(successResponse(result, 'Image uploaded successfully'));
  } catch (error: any) {
    console.error('Upload image error:', error);
    const status = error.status || 500;
    res.status(status).json(errorResponse(error.message || 'Error uploading image'));
  }
};

/**
 * Upload multiple images.
 * POST /api/media/upload/images
 * Form field: "images" (array)
 */
export const uploadImages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json(errorResponse('Not authenticated')); return; }

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json(errorResponse('No image files provided'));
      return;
    }

    const opts = buildUploadOptions(req, userId);
    const mediaList = await uploadMultipleMedia(files, opts);

    // Resolve signed URLs
    const results = [];
    for (const m of mediaList) {
      results.push(await getMediaById(m.id));
    }

    res.status(201).json(successResponse(results, `${results.length} images uploaded`));
  } catch (error: any) {
    console.error('Upload images error:', error);
    const status = error.status || 500;
    res.status(status).json(errorResponse(error.message || 'Error uploading images'));
  }
};

// ─── Avatar upload ───────────────────────────────────────────────────

/**
 * Upload user avatar.
 * POST /api/media/upload/avatar
 * Form field: "avatar"
 */
export const uploadAvatar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json(errorResponse('Not authenticated')); return; }

    const file = req.file;
    if (!file) { res.status(400).json(errorResponse('No avatar file provided')); return; }

    const media = await uploadMedia(file.buffer, file.originalname, file.mimetype, {
      category: 'avatar',
      entityType: 'user',
      entityId: userId,
      uploaderId: userId,
      isPublic: true,
      optimize: true,
      generateThumbs: true,
      maxWidth: 512,
      maxHeight: 512,
    });

    const result = await getMediaById(media.id);
    res.status(201).json(successResponse(result, 'Avatar uploaded'));
  } catch (error: any) {
    console.error('Upload avatar error:', error);
    const status = error.status || 500;
    res.status(status).json(errorResponse(error.message || 'Error uploading avatar'));
  }
};

// ─── Video upload ────────────────────────────────────────────────────

/**
 * Upload a single video (trailer).
 * POST /api/media/upload/video
 * Form field: "video"
 */
export const uploadVideo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json(errorResponse('Not authenticated')); return; }

    const file = req.file;
    if (!file) { res.status(400).json(errorResponse('No video file provided')); return; }

    const opts: UploadOptions = {
      category: (req.body.category as any) || 'trailer',
      entityType: (req.body.entity_type as any) || 'game',
      entityId: req.body.entity_id ? parseInt(req.body.entity_id, 10) : undefined,
      uploaderId: userId,
      isPublic: req.body.is_public !== 'false',
      optimize: false,
      generateThumbs: false,
    };

    const media = await uploadMedia(file.buffer, file.originalname, file.mimetype, opts);
    const result = await getMediaById(media.id);

    res.status(201).json(successResponse(result, 'Video uploaded'));
  } catch (error: any) {
    console.error('Upload video error:', error);
    const status = error.status || 500;
    res.status(status).json(errorResponse(error.message || 'Error uploading video'));
  }
};

// ─── Document upload ─────────────────────────────────────────────────

/**
 * Upload a document (PDF).
 * POST /api/media/upload/document
 * Form field: "document"
 */
export const uploadDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json(errorResponse('Not authenticated')); return; }

    const file = req.file;
    if (!file) { res.status(400).json(errorResponse('No document file provided')); return; }

    const opts: UploadOptions = {
      category: 'document',
      entityType: (req.body.entity_type as any) || 'general',
      entityId: req.body.entity_id ? parseInt(req.body.entity_id, 10) : undefined,
      uploaderId: userId,
      isPublic: req.body.is_public !== 'false',
      optimize: false,
      generateThumbs: false,
    };

    const media = await uploadMedia(file.buffer, file.originalname, file.mimetype, opts);
    const result = await getMediaById(media.id);

    res.status(201).json(successResponse(result, 'Document uploaded'));
  } catch (error: any) {
    console.error('Upload document error:', error);
    const status = error.status || 500;
    res.status(status).json(errorResponse(error.message || 'Error uploading document'));
  }
};

// ─── Read / List ─────────────────────────────────────────────────────

/**
 * Get a single media item with signed URL.
 * GET /api/media/:id
 */
export const getMedia = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json(errorResponse('Invalid media ID')); return; }

    const media = await getMediaById(id);
    if (!media) { res.status(404).json(errorResponse('Media not found')); return; }

    // If not public, only uploader or admin can view
    const raw = await Media.findByPk(id, { attributes: ['is_public', 'uploader_id'] });
    if (raw && !raw.is_public) {
      const userId = req.user?.id;
      const isAdmin = req.user?.type === 'admin';
      if (!userId || (raw.uploader_id !== userId && !isAdmin)) {
        res.status(403).json(errorResponse('Not authorized to view this media'));
        return;
      }
    }

    res.json(successResponse(media));
  } catch (error: any) {
    console.error('Get media error:', error);
    res.status(500).json(errorResponse('Error fetching media'));
  }
};

/**
 * Get a signed URL for a media item (redirect or JSON).
 * GET /api/media/:id/url
 */
export const getMediaUrl = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json(errorResponse('Invalid media ID')); return; }

    const media = await Media.findByPk(id);
    if (!media) { res.status(404).json(errorResponse('Media not found')); return; }

    // Auth check for non-public
    if (!media.is_public) {
      const userId = req.user?.id;
      const isAdmin = req.user?.type === 'admin';
      if (!userId || (media.uploader_id !== userId && !isAdmin)) {
        res.status(403).json(errorResponse('Not authorized'));
        return;
      }
    }

    const url = await getSignedUrl(media.storage_key);

    if (req.query.redirect === 'true') {
      res.redirect(302, url);
      return;
    }

    res.json(successResponse({ url, expires_in: storageConfig.s3.signedUrlExpires }));
  } catch (error: any) {
    console.error('Get media URL error:', error);
    res.status(500).json(errorResponse('Error generating media URL'));
  }
};

/**
 * List media for an entity.
 * GET /api/media/entity/:entityType/:entityId
 * Query: ?category=cover
 */
export const listEntityMedia = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entityType = req.params.entityType as any;
    const entityId = parseId(req.params.entityId);
    if (!entityId) { res.status(400).json(errorResponse('Invalid entity ID')); return; }

    const validTypes = ['game', 'user', 'review', 'developer', 'publisher', 'platform', 'general'];
    if (!validTypes.includes(entityType)) {
      res.status(400).json(errorResponse(`entity_type must be one of: ${validTypes.join(', ')}`));
      return;
    }

    const category = req.query.category as any;
    const media = await getMediaForEntity(entityType, entityId, category);

    res.json(successResponse(media));
  } catch (error: any) {
    console.error('List entity media error:', error);
    res.status(500).json(errorResponse('Error listing media'));
  }
};

/**
 * List current user's uploads.
 * GET /api/media/my-uploads
 */
export const myUploads = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json(errorResponse('Not authenticated')); return; }

    const { page, limit, offset } = getPaginationParams(req);
    const { count, rows } = await Media.findAndCountAll({
      where: { uploader_id: userId },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const pagination = getPaginationResult(count, page, limit);

    // Attach URLs
    const items = [];
    for (const row of rows) {
      const url = await getSignedUrl(row.storage_key);
      items.push({ ...row.toJSON(), url });
    }

    res.json(successResponse({ items, pagination }));
  } catch (error: any) {
    console.error('My uploads error:', error);
    res.status(500).json(errorResponse('Error listing uploads'));
  }
};

/**
 * Get storage stats for current user.
 * GET /api/media/stats
 */
export const mediaStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json(errorResponse('Not authenticated')); return; }

    const stats = await getUserMediaStats(userId);
    res.json(successResponse(stats));
  } catch (error: any) {
    console.error('Media stats error:', error);
    res.status(500).json(errorResponse('Error fetching media stats'));
  }
};

// ─── Delete ──────────────────────────────────────────────────────────

/**
 * Delete a media item.
 * DELETE /api/media/:id
 */
export const removeMedia = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json(errorResponse('Not authenticated')); return; }

    const id = parseId(req.params.id);
    if (!id) { res.status(400).json(errorResponse('Invalid media ID')); return; }

    const isAdmin = req.user?.type === 'admin';
    const ok = await deleteMedia(id, userId, isAdmin);
    if (!ok) { res.status(404).json(errorResponse('Media not found')); return; }

    res.json(successResponse(null, 'Media deleted'));
  } catch (error: any) {
    console.error('Delete media error:', error);
    const status = error.status || 500;
    res.status(status).json(errorResponse(error.message || 'Error deleting media'));
  }
};

// ─── Replace (versioned) ─────────────────────────────────────────────

/**
 * Replace a media item (creates a new version).
 * PUT /api/media/:id/replace
 * Form field: "image"
 */
export const replaceMediaItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json(errorResponse('Not authenticated')); return; }

    const id = parseId(req.params.id);
    if (!id) { res.status(400).json(errorResponse('Invalid media ID')); return; }

    const file = req.file;
    if (!file) { res.status(400).json(errorResponse('No file provided')); return; }

    const opts = buildUploadOptions(req, userId);
    const media = await replaceMedia(id, file.buffer, file.originalname, file.mimetype, opts);
    const result = await getMediaById(media.id);

    res.json(successResponse(result, 'Media replaced (new version created)'));
  } catch (error: any) {
    console.error('Replace media error:', error);
    const status = error.status || 500;
    res.status(status).json(errorResponse(error.message || 'Error replacing media'));
  }
};

// ─── Helper ──────────────────────────────────────────────────────────

function buildUploadOptions(req: AuthenticatedRequest, userId: number): UploadOptions {
  return {
    category: (req.body.category as any) || 'other',
    entityType: (req.body.entity_type as any) || 'general',
    entityId: req.body.entity_id ? parseInt(req.body.entity_id, 10) : undefined,
    uploaderId: userId,
    isPublic: req.body.is_public !== 'false',
    optimize: req.body.optimize !== 'false',
    generateThumbs: req.body.generate_thumbs !== 'false',
    maxWidth: req.body.max_width ? parseInt(req.body.max_width, 10) : undefined,
    maxHeight: req.body.max_height ? parseInt(req.body.max_height, 10) : undefined,
  };
}
