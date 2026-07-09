import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';
import { logger } from './logger.js';

// Cloudinary is the primary storage for user-uploaded images (avatars,
// company logo, product images). It activates automatically whenever all
// three credentials are present, independent of NODE_ENV, so production
// (which has real credentials) always uses it while a developer without
// Cloudinary credentials transparently falls back to local disk — see
// backend/middlewares/upload.js.
export const cloudinaryEnabled = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret,
);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
  logger.info('Cloudinary storage enabled for uploads');
} else if (env.isProduction) {
  logger.warn('Cloudinary credentials not set — production is falling back to local-disk uploads, which will not survive redeploys or be reachable if /uploads is not proxied');
} else {
  logger.info('Cloudinary credentials not set — using local-disk uploads (development fallback)');
}

export { cloudinary };
