/**
 * Media Service
 *
 * Business logic for media uploads, retrieval, deletion and URL signing.
 * Orchestrates the storage provider, image processor, and Media model.
 */

import Media, { MediaCategory, MediaEntityType } from '../models/Media';
import {
  uploadFile,
  deleteFile,
  getSignedUrl,
  generateStorageKey,
} from './storageProvider';
import {
  isValidImage,
  sanitizeImage,
  optimizeImage,
  generateThumbnails,
  getImageMetadata,
} from '../utils/imageProcessor';
import storageConfig from '../config/storage';
import { Op } from 'sequelize';

// ─── Types ───────────────────────────────────────────────────────────

export interface UploadOptions {
  category: MediaCategory;
  entityType: MediaEntityType;
  entityId?: number;
  uploaderId: number;
  isPublic?: boolean;
  optimize?: boolean;        // convert images to WebP, default true for images
  generateThumbs?: boolean;  // generate thumbnails, default true for cover/screenshot/avatar
  maxWidth?: number;
  maxHeight?: number;
}

export interface MediaWithUrl extends Record<string, unknown> {
  id: number;
  url: string;
  thumbnailUrls?: Record<string, string>;
}

// ─── Folder conventions ──────────────────────────────────────────────

function resolveFolder(entityType: MediaEntityType, category: MediaCategory): string {
  // Normalize entityType to a safe, known set of folder names
  const allowedEntityTypes: Record<string, string> = {
    game: 'game',
    user: 'user',
    general: 'general',
    // add other valid entity types here as needed, mapping to their folder names
  };

  const normalizedEntityTypeKey = String(entityType).toLowerCase();
  const safeEntityType = allowedEntityTypes[normalizedEntityTypeKey] ?? 'general';

  // Normalize category to a safe, known set of folder names
  const allowedCategories: Record<string, string> = {
    avatar: 'avatar',
    cover: 'cover',
    screenshot: 'screenshot',
    trailer: 'trailer',
    document: 'document',
    other: 'other',
    // add other valid categories here as needed, mapping to their folder names
  };

  const normalizedCategoryKey = String(category).toLowerCase();
  const safeCategory = allowedCategories[normalizedCategoryKey] ?? 'other';

  return `${safeEntityType}s/${safeCategory}`;
}

// ─── Upload single file ──────────────────────────────────────────────

export async function uploadMedia(
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string,
  opts: UploadOptions,
): Promise<Media> {
  const isImage = storageConfig.limits.allowedImageMimeTypes.includes(mimeType);
  const shouldOptimize = opts.optimize ?? isImage;
  const shouldThumb = opts.generateThumbs ??
    (isImage && ['cover', 'screenshot', 'avatar'].includes(opts.category));

  let processedBuffer = fileBuffer;
  let processedMime = mimeType;
  let width: number | undefined;
  let height: number | undefined;

  // ── Image processing pipeline ────────────────────────────────────
  if (isImage) {
    // Validate magic bytes
    const valid = await isValidImage(fileBuffer);
    if (!valid) {
      throw Object.assign(new Error('Invalid or corrupt image file'), { status: 400 });
    }

    // Sanitize (strip EXIF/GPS)
    processedBuffer = await sanitizeImage(fileBuffer);

    // Optimize (convert to WebP)
    if (shouldOptimize) {
      const optimized = await optimizeImage(processedBuffer, {
        maxWidth: opts.maxWidth,
        maxHeight: opts.maxHeight,
      });
      processedBuffer = optimized.buffer;
      processedMime = optimized.mimeType;
      width = optimized.width;
      height = optimized.height;
    } else {
      const meta = await getImageMetadata(processedBuffer);
      width = meta.width;
      height = meta.height;
    }
  }

  // ── Upload main file ─────────────────────────────────────────────
  const folder = resolveFolder(opts.entityType, opts.category);
  const key = generateStorageKey(folder, originalFilename);
  // Adjust extension if we converted to WebP
  const finalKey = processedMime === 'image/webp' && !key.endsWith('.webp')
    ? key.replace(/\.[^.]+$/, '.webp')
    : key;

  const result = await uploadFile(processedBuffer, finalKey, processedMime);

  // ── Thumbnails ───────────────────────────────────────────────────
  let thumbnailKey: string | undefined;
  let thumbnailsMap: Record<string, string> | undefined;

  if (isImage && shouldThumb) {
    const thumbs = await generateThumbnails(fileBuffer); // use original for best quality
    thumbnailsMap = {};

    for (const t of thumbs) {
      const tKey = generateStorageKey(`${folder}/thumbs`, `${originalFilename}`)
        .replace(/\.[^.]+$/, `_${t.suffix}.webp`);
      await uploadFile(t.buffer, tKey, t.mimeType);
      thumbnailsMap[t.suffix] = tKey;
    }

    thumbnailKey = thumbnailsMap['thumb'] || undefined;
  }

  // ── Versioning: bump if replacing for same entity ─────────────────
  let version = 1;
  if (opts.entityId) {
    const existing = await Media.findOne({
      where: {
        entity_type: opts.entityType,
        entity_id: opts.entityId,
        category: opts.category,
      },
      order: [['version', 'DESC']],
    });
    if (existing) {
      version = existing.version + 1;
    }
  }

  // ── Save to DB ───────────────────────────────────────────────────
  const media = await Media.create({
    storage_key: finalKey,
    original_filename: originalFilename,
    mime_type: processedMime,
    file_size: processedBuffer.length,
    category: opts.category,
    entity_type: opts.entityType,
    entity_id: opts.entityId,
    uploader_id: opts.uploaderId,
    width,
    height,
    thumbnail_key: thumbnailKey,
    thumbnails: thumbnailsMap,
    version,
    is_public: opts.isPublic ?? true,
    provider: result.provider,
  });

  return media;
}

// ─── Upload multiple files ───────────────────────────────────────────

export async function uploadMultipleMedia(
  files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>,
  opts: UploadOptions,
): Promise<Media[]> {
  const results: Media[] = [];
  for (const file of files) {
    const media = await uploadMedia(file.buffer, file.originalname, file.mimetype, opts);
    results.push(media);
  }
  return results;
}

// ─── Get media with signed URL ───────────────────────────────────────

export async function getMediaById(id: number): Promise<MediaWithUrl | null> {
  const media = await Media.findByPk(id);
  if (!media) return null;

  const url = await getSignedUrl(media.storage_key);
  let thumbnailUrls: Record<string, string> | undefined;

  if (media.thumbnails) {
    thumbnailUrls = {};
    for (const [suffix, key] of Object.entries(media.thumbnails)) {
      thumbnailUrls[suffix] = await getSignedUrl(key);
    }
  }

  return {
    ...media.toJSON(),
    url,
    thumbnailUrls,
  };
}

// ─── List media for entity ───────────────────────────────────────────

export async function getMediaForEntity(
  entityType: MediaEntityType,
  entityId: number,
  category?: MediaCategory,
): Promise<MediaWithUrl[]> {
  const where: Record<string, unknown> = {
    entity_type: entityType,
    entity_id: entityId,
  };
  if (category) where.category = category;

  const items = await Media.findAll({
    where,
    order: [['category', 'ASC'], ['version', 'DESC'], ['created_at', 'DESC']],
  });

  const results: MediaWithUrl[] = [];
  for (const item of items) {
    const url = await getSignedUrl(item.storage_key);
    let thumbnailUrls: Record<string, string> | undefined;
    if (item.thumbnails) {
      thumbnailUrls = {};
      for (const [suffix, key] of Object.entries(item.thumbnails)) {
        thumbnailUrls[suffix] = await getSignedUrl(key);
      }
    }
    results.push({ ...item.toJSON(), url, thumbnailUrls });
  }

  return results;
}

// ─── Delete media ────────────────────────────────────────────────────

export async function deleteMedia(id: number, requesterId: number, isAdmin: boolean): Promise<boolean> {
  const media = await Media.findByPk(id);
  if (!media) return false;

  // Only uploader or admin can delete
  if (media.uploader_id !== requesterId && !isAdmin) {
    throw Object.assign(new Error('Not authorized to delete this media'), { status: 403 });
  }

  // Delete main file
  await deleteFile(media.storage_key);

  // Delete thumbnails
  if (media.thumbnails) {
    for (const key of Object.values(media.thumbnails)) {
      await deleteFile(key).catch(() => {}); // best effort
    }
  }

  await media.destroy();
  return true;
}

// ─── Replace media (versioned) ───────────────────────────────────────

export async function replaceMedia(
  existingId: number,
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string,
  opts: UploadOptions,
): Promise<Media> {
  const existing = await Media.findByPk(existingId);
  if (!existing) {
    throw Object.assign(new Error('Media not found'), { status: 404 });
  }

  // Upload new version (keeps old one for history)
  const newMedia = await uploadMedia(fileBuffer, originalFilename, mimeType, {
    ...opts,
    entityType: existing.entity_type as MediaEntityType,
    entityId: existing.entity_id,
    category: existing.category as MediaCategory,
  });

  return newMedia;
}

// ─── User media stats ────────────────────────────────────────────────

export async function getUserMediaStats(userId: number): Promise<{
  total: number;
  totalSize: number;
  byCategory: Record<string, number>;
}> {
  const items = await Media.findAll({
    where: { uploader_id: userId },
    attributes: ['category', 'file_size'],
  });

  const byCategory: Record<string, number> = {};
  let totalSize = 0;

  for (const item of items) {
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    totalSize += item.file_size;
  }

  return { total: items.length, totalSize, byCategory };
}
