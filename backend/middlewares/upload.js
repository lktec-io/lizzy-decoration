import multer from 'multer';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateRandomToken } from '../utils/tokenUtils.js';
import { cloudinary, cloudinaryEnabled } from '../config/cloudinary.js';
import { logger } from '../config/logger.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function diskStorageFor(subfolder) {
  return multer.diskStorage({
    // Multer's disk storage never creates its destination directory — it
    // just tries to write there and throws ENOENT if it's missing. A fresh
    // server (or any deploy that doesn't preserve empty directories/.gitkeep
    // files) would have no uploads/<subfolder> until something creates it.
    // recursive: true is idempotent — a no-op if the directory already exists.
    destination: (req, file, cb) => {
      const dir = path.join(UPLOADS_ROOT, subfolder);
      fs.mkdir(dir, { recursive: true }, (err) => {
        if (err) return cb(err);
        return cb(null, dir);
      });
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${generateRandomToken(8)}${ext}`);
    },
  });
}

// Uploads a buffer (from multer.memoryStorage) straight to Cloudinary — no
// disk round-trip, so it works identically on any server regardless of
// whether the filesystem is ephemeral or /uploads is proxied by Nginx.
async function uploadBufferToCloudinary(buffer, mimetype, folder) {
  const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`;
  return cloudinary.uploader.upload(dataUri, { folder, resource_type: 'image' });
}

// After multer parses the file, mirror it onto Cloudinary and normalize
// req.file so every consumer downstream (controllers, services) can call
// resolveUploadedFileUrl(req.file, subfolder) without caring which storage
// backend actually ran.
function cloudinaryUploadMiddleware(cloudinaryFolder) {
  return asyncHandler(async (req, res, next) => {
    if (!req.file) return next();

    const result = await uploadBufferToCloudinary(req.file.buffer, req.file.mimetype, cloudinaryFolder);
    req.file.secureUrl = result.secure_url;
    req.file.cloudinaryPublicId = result.public_id;
    return next();
  });
}

// subfolder: local-disk directory name (dev fallback) and default Cloudinary
// folder. cloudinaryFolder: override when the two need to differ (e.g. the
// company logo lives in uploads/logo/ locally but Cloudinary's company/
// folder per the requested folder layout).
export function createUploader({ subfolder, cloudinaryFolder = subfolder, allowedMimeTypes = IMAGE_MIME_TYPES, maxSizeMb = 2 }) {
  const fileFilter = (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new Error(`Unsupported file type. Allowed: ${allowedMimeTypes.join(', ')}`));
      return;
    }
    cb(null, true);
  };

  // Cloudinary needs the raw bytes in memory to upload; local disk needs a
  // destination path. Optional dev fallback: only disk-backed when
  // Cloudinary credentials aren't configured (see backend/config/cloudinary.js).
  const storage = cloudinaryEnabled ? multer.memoryStorage() : diskStorageFor(subfolder);

  const uploader = multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
  });

  return {
    single(fieldName) {
      if (!cloudinaryEnabled) return uploader.single(fieldName);
      return [uploader.single(fieldName), cloudinaryUploadMiddleware(cloudinaryFolder)];
    },
  };
}

export function publicPathFor(subfolder, filename) {
  return `/uploads/${subfolder}/${filename}`;
}

// The single call site every service should use to get "the URL to store"
// for an uploaded file, regardless of which storage backend handled it.
export function resolveUploadedFileUrl(file, subfolder) {
  if (file.secureUrl) return file.secureUrl;
  return publicPathFor(subfolder, file.filename);
}

// Cloudinary's public_id isn't stored separately (no DB schema change) — it's
// recoverable from the secure_url we already persist, since we never set a
// custom public_id at upload time (Cloudinary auto-generates folder/id.ext).
export function extractCloudinaryPublicId(url) {
  if (typeof url !== 'string') return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+(?:\?.*)?$/);
  return match ? match[1] : null;
}

// Best-effort delete of a previously-uploaded asset. Only acts on Cloudinary
// URLs (local-disk cleanup is handled separately by callers via fs.unlink,
// unchanged); never throws — a failed cleanup shouldn't fail the request
// that triggered it.
export async function deleteUploadedFile(url) {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) return;
  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (err) {
    logger.warn('Failed to delete Cloudinary asset', { publicId, message: err.message });
  }
}

// Every subfolder any createUploader() instance writes to on local disk.
// Belt-and-suspenders alongside the per-request mkdir above: called once at
// server startup so the very first upload on a fresh server doesn't pay for
// directory creation on the request path. Only relevant to the local-disk
// dev fallback — Cloudinary has no directories to create.
const KNOWN_UPLOAD_SUBFOLDERS = ['avatars', 'products', 'logo'];

export async function ensureUploadDirs() {
  if (cloudinaryEnabled) return;
  await Promise.all(
    KNOWN_UPLOAD_SUBFOLDERS.map((subfolder) => fsPromises.mkdir(path.join(UPLOADS_ROOT, subfolder), { recursive: true })),
  );
}
