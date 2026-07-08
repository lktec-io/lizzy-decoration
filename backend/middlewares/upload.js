import multer from 'multer';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateRandomToken } from '../utils/tokenUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function createUploader({ subfolder, allowedMimeTypes = IMAGE_MIME_TYPES, maxSizeMb = 2 }) {
  const storage = multer.diskStorage({
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

  const fileFilter = (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new Error(`Unsupported file type. Allowed: ${allowedMimeTypes.join(', ')}`));
      return;
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
  });
}

export function publicPathFor(subfolder, filename) {
  return `/uploads/${subfolder}/${filename}`;
}

// Every subfolder any createUploader() instance writes to. Belt-and-
// suspenders alongside the per-request mkdir above: called once at server
// startup so the very first upload on a fresh server doesn't pay for
// directory creation on the request path, and so the directories exist
// even before the first request of that type arrives.
const KNOWN_UPLOAD_SUBFOLDERS = ['avatars', 'products', 'logo'];

export async function ensureUploadDirs() {
  await Promise.all(
    KNOWN_UPLOAD_SUBFOLDERS.map((subfolder) => fsPromises.mkdir(path.join(UPLOADS_ROOT, subfolder), { recursive: true })),
  );
}
