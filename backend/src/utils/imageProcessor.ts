/**
 * Image Processing Utilities
 *
 * Uses Sharp for:
 *  - Thumbnail generation at multiple sizes
 *  - Format conversion / optimization (WebP output)
 *  - Metadata extraction (dimensions, format)
 *  - File sanitization (strips EXIF/GPS data)
 */

import sharp from 'sharp';
import storageConfig from '../config/storage';

// ─── Types ───────────────────────────────────────────────────────────

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;       // bytes (of the input buffer)
  hasAlpha: boolean;
}

export interface ProcessedImage {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
}

export interface ThumbnailResult {
  suffix: string;
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: string;
}

// ─── Metadata extraction ─────────────────────────────────────────────

export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  const meta = await sharp(buffer).metadata();
  return {
    width: meta.width || 0,
    height: meta.height || 0,
    format: meta.format || 'unknown',
    size: buffer.length,
    hasAlpha: meta.hasAlpha || false,
  };
}

// ─── Sanitization (strip EXIF, GPS) ──────────────────────────────────

/**
 * Remove all metadata (EXIF, IPTC, XMP, GPS) from an image buffer.
 * Returns a clean buffer in the original format.
 */
export async function sanitizeImage(buffer: Buffer): Promise<Buffer> {
  const meta = await sharp(buffer).metadata();
  let pipeline = sharp(buffer).rotate(); // auto-rotate based on EXIF, then strip

  // Re-encode in the same format to strip metadata
  switch (meta.format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: 90, mozjpeg: true });
      break;
    case 'png':
      pipeline = pipeline.png({ compressionLevel: 8 });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality: 85 });
      break;
    case 'gif':
      // sharp has limited GIF support — pass through
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality: 70 });
      break;
    default:
      pipeline = pipeline.jpeg({ quality: 90 }); // fallback
  }

  return pipeline.toBuffer();
}

// ─── Optimization (convert to WebP) ──────────────────────────────────

/**
 * Optimize an image by converting to WebP (lossy, quality 80).
 * GIF images are kept as-is (animated frames).
 */
export async function optimizeImage(
  buffer: Buffer,
  opts?: { quality?: number; maxWidth?: number; maxHeight?: number },
): Promise<ProcessedImage> {
  const quality = opts?.quality ?? 80;
  const meta = await sharp(buffer).metadata();

  // Skip optimization for GIFs (animated)
  if (meta.format === 'gif') {
    return {
      buffer,
      mimeType: 'image/gif',
      width: meta.width || 0,
      height: meta.height || 0,
    };
  }

  let pipeline = sharp(buffer).rotate();

  // Resize if max dimensions specified
  if (opts?.maxWidth || opts?.maxHeight) {
    pipeline = pipeline.resize({
      width: opts.maxWidth,
      height: opts.maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const optimized = await pipeline.webp({ quality }).toBuffer({ resolveWithObject: true });

  return {
    buffer: optimized.data,
    mimeType: 'image/webp',
    width: optimized.info.width,
    height: optimized.info.height,
  };
}

// ─── Thumbnail generation ────────────────────────────────────────────

/**
 * Generate thumbnails at all configured sizes.
 * Output is WebP with cover-crop.
 */
export async function generateThumbnails(buffer: Buffer): Promise<ThumbnailResult[]> {
  const sizes = storageConfig.limits.thumbnailSizes;
  const results: ThumbnailResult[] = [];

  for (const size of sizes) {
    const result = await sharp(buffer)
      .rotate()
      .resize(size.width, size.height, { fit: 'cover', position: 'centre' })
      .webp({ quality: 75 })
      .toBuffer({ resolveWithObject: true });

    results.push({
      suffix: size.suffix,
      buffer: result.data,
      width: result.info.width,
      height: result.info.height,
      mimeType: 'image/webp',
    });
  }

  return results;
}

// ─── Validation helpers ──────────────────────────────────────────────

/**
 * Quick validation that a buffer is a valid image by reading its header.
 * Returns false for corrupt / non-image files even if mime type is spoofed.
 */
export async function isValidImage(buffer: Buffer): Promise<boolean> {
  try {
    const meta = await sharp(buffer).metadata();
    return !!meta.format && !!meta.width && !!meta.height;
  } catch {
    return false;
  }
}
