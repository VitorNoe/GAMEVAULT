/**
 * Storage Provider — abstraction over local filesystem and AWS S3
 *
 * Exposes a unified interface (upload, delete, getSignedUrl) so the rest
 * of the app never needs to know which backend is active.
 *
 * In development the default provider is "local" and files are stored
 * under ./uploads with direct serving. In production, set STORAGE_PROVIDER=s3.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import storageConfig, { StorageProviderType } from '../config/storage';

// ─── Types ───────────────────────────────────────────────────────────

export interface UploadResult {
  key: string;           // storage key / relative path
  url: string;           // public or signed URL
  size: number;          // bytes
  mimeType: string;
  provider: StorageProviderType;
}

// ─── S3 client (lazy-init) ───────────────────────────────────────────

let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: storageConfig.s3.region,
      credentials: {
        accessKeyId: storageConfig.s3.accessKeyId,
        secretAccessKey: storageConfig.s3.secretAccessKey,
      },
    });
  }
  return _s3Client;
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Ensure the upload directory tree exists. */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Generate a unique storage key for a file. */
export function generateStorageKey(
  folder: string,
  originalName: string,
  suffix?: string,
): string {
  const ext = path.extname(originalName).toLowerCase();
  const hash = crypto.randomBytes(16).toString('hex');
  const safeName = suffix ? `${hash}_${suffix}${ext}` : `${hash}${ext}`;
  return `${folder}/${safeName}`;
}

// ─── Local provider ──────────────────────────────────────────────────

async function localUpload(
  buffer: Buffer,
  key: string,
  mimeType: string,
): Promise<UploadResult> {
  const fullPath = path.join(storageConfig.local.uploadDir, key);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, buffer);

  return {
    key,
    url: `${storageConfig.local.serveBase}/${key}`,
    size: buffer.length,
    mimeType,
    provider: 'local',
  };
}

async function localDelete(key: string): Promise<void> {
  const fullPath = path.join(storageConfig.local.uploadDir, key);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

async function localGetSignedUrl(key: string): Promise<string> {
  // For local, just return the serving URL (no real signing needed)
  return `${storageConfig.local.serveBase}/${key}`;
}

async function localFileExists(key: string): Promise<boolean> {
  const fullPath = path.join(storageConfig.local.uploadDir, key);
  return fs.existsSync(fullPath);
}

// ─── S3 provider ─────────────────────────────────────────────────────

async function s3Upload(
  buffer: Buffer,
  key: string,
  mimeType: string,
): Promise<UploadResult> {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: storageConfig.s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }),
  );

  const url = await s3GetSignedUrl(key);

  return {
    key,
    url,
    size: buffer.length,
    mimeType,
    provider: 's3',
  };
}

async function s3Delete(key: string): Promise<void> {
  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: storageConfig.s3.bucket,
      Key: key,
    }),
  );
}

async function s3GetSignedUrl(key: string): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: storageConfig.s3.bucket,
    Key: key,
  });
  return awsGetSignedUrl(client, command, {
    expiresIn: storageConfig.s3.signedUrlExpires,
  });
}

async function s3FileExists(key: string): Promise<boolean> {
  try {
    const client = getS3Client();
    await client.send(
      new HeadObjectCommand({
        Bucket: storageConfig.s3.bucket,
        Key: key,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

// ─── Unified public API ──────────────────────────────────────────────

export async function uploadFile(
  buffer: Buffer,
  key: string,
  mimeType: string,
): Promise<UploadResult> {
  if (storageConfig.provider === 's3') {
    return s3Upload(buffer, key, mimeType);
  }
  return localUpload(buffer, key, mimeType);
}

export async function deleteFile(key: string): Promise<void> {
  if (storageConfig.provider === 's3') {
    return s3Delete(key);
  }
  return localDelete(key);
}

export async function getSignedUrl(key: string): Promise<string> {
  if (storageConfig.provider === 's3') {
    return s3GetSignedUrl(key);
  }
  return localGetSignedUrl(key);
}

export async function fileExists(key: string): Promise<boolean> {
  if (storageConfig.provider === 's3') {
    return s3FileExists(key);
  }
  return localFileExists(key);
}
