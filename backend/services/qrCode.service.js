import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import fsSync from 'fs';
import QRCode from 'qrcode';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../config/logger.js';
import * as productRepository from '../repositories/product.repository.js';
import * as qrCodeRepository from '../repositories/qrCode.repository.js';
import { cloudinaryEnabled } from '../config/cloudinary.js';
import { uploadImageBuffer, deleteUploadedFile } from '../middlewares/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');
const QR_DIR = path.join(UPLOADS_ROOT, 'qrcodes');
const QR_CLOUDINARY_FOLDER = 'qrcodes';

// The QR intentionally does NOT encode a branch: products are a shared
// catalog (one row per SKU) with per-branch stock in `inventory` — see
// docs/PROJECT_PLAN.md §2. A physical label scanned at any branch resolves
// to the same product; the scanning POS terminal already knows its own
// branch from the logged-in session, so baking a branch into the QR
// payload would be actively wrong for a product stocked at multiple branches.
function buildPayload(product) {
  return {
    productId: product.id,
    code: product.code,
    name: product.name,
    sellingPrice: Number(product.selling_price),
  };
}

// A stored qr_path is only trustworthy if the bytes it points to still
// exist. Cloud URLs are treated as durable (Cloudinary doesn't silently
// lose assets); this also self-heals any row left over from before the
// Cloudinary migration — a legacy "/uploads/..." path is treated as
// missing and transparently regenerated onto Cloudinary on next access.
// The local-disk fallback checks the actual file, since that directory
// does not survive every deploy.
function isUsableQrPath(qrPath) {
  if (!qrPath) return false;
  if (cloudinaryEnabled) return qrPath.includes('res.cloudinary.com');
  return fsSync.existsSync(path.join(UPLOADS_ROOT, qrPath.replace('/uploads/', '')));
}

async function deleteOldQrFile(oldQrPath) {
  if (!oldQrPath) return;
  if (oldQrPath.includes('res.cloudinary.com')) {
    await deleteUploadedFile(oldQrPath);
    return;
  }
  const oldFilePath = path.join(UPLOADS_ROOT, oldQrPath.replace('/uploads/', ''));
  await fs.unlink(oldFilePath).catch(() => {
    // Old file already gone or inaccessible — not fatal.
  });
}

export async function getForProduct(productId) {
  const product = await productRepository.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const existing = await qrCodeRepository.findByProductId(productId);
  if (existing && isUsableQrPath(existing.qr_path)) return existing;

  // Row missing, or its image is gone — regenerate instead of serving (or
  // 500ing on) a broken reference.
  return generate(productId);
}

export async function generate(productId) {
  const product = await productRepository.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  logger.info('Generating QR...', { productId });

  const existing = await qrCodeRepository.findByProductId(productId);
  const payload = buildPayload(product);
  const buffer = await QRCode.toBuffer(JSON.stringify(payload), { type: 'png', width: 320, margin: 2 });

  // A unique-per-call suffix (not the DB's regenerated_count, which lags by
  // one write and previously produced the exact same filename/public_id on
  // the 2nd-ever regenerate) — guarantees every regeneration gets a brand
  // new URL, so a browser can never serve a stale cached image after
  // "Regenerate" even though nothing about the request path changed.
  const uniqueSuffix = Date.now();

  logger.info('QR generated', { productId, uniqueSuffix });

  const qrPath = cloudinaryEnabled
    ? await uploadQrToCloudinary(buffer, productId, uniqueSuffix)
    : await writeQrToDisk(buffer, productId, uniqueSuffix);

  await deleteOldQrFile(existing?.qr_path);

  return qrCodeRepository.upsert(productId, qrPath, payload);
}

async function uploadQrToCloudinary(buffer, productId, uniqueSuffix) {
  const result = await uploadImageBuffer(buffer, 'image/png', QR_CLOUDINARY_FOLDER, {
    publicId: `product-${productId}-${uniqueSuffix}`,
  });
  logger.info('QR uploaded', { productId, url: result.secure_url });
  return result.secure_url;
}

async function writeQrToDisk(buffer, productId, uniqueSuffix) {
  // Never assume uploads/qrcodes exists — create it right before writing,
  // regardless of what ran (or didn't run) at server startup.
  await fs.mkdir(QR_DIR, { recursive: true });
  const filename = `product-${productId}-${uniqueSuffix}.png`;
  await fs.writeFile(path.join(QR_DIR, filename), buffer);
  return `/uploads/qrcodes/${filename}`;
}

// Centralized read path for embedding a QR into a PDF label — the only
// place that knows how to turn a product's QR code back into raw image
// bytes. Goes through getForProduct() first so a missing/stale image is
// regenerated before anything tries to read it; PDF generation never has
// to know about storage backends or handle ENOENT itself.
export async function getQrImageBuffer(productId) {
  const qr = await getForProduct(productId);

  if (qr.qr_path.startsWith('http')) {
    const response = await fetch(qr.qr_path);
    if (!response.ok) throw new ApiError(502, 'Failed to fetch QR code image');
    return Buffer.from(await response.arrayBuffer());
  }
  return fs.readFile(path.join(UPLOADS_ROOT, qr.qr_path.replace('/uploads/', '')));
}
