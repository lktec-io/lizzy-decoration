import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateRandomToken } from '../utils/tokenUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function createUploader({ subfolder, allowedMimeTypes = IMAGE_MIME_TYPES, maxSizeMb = 2 }) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(UPLOADS_ROOT, subfolder));
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
