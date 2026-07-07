import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import QRCode from 'qrcode';
import { ApiError } from '../utils/apiError.js';
import * as productRepository from '../repositories/product.repository.js';
import * as qrCodeRepository from '../repositories/qrCode.repository.js';
import { publicPathFor } from '../middlewares/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');
const QR_DIR = path.join(UPLOADS_ROOT, 'qrcodes');

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

export async function getForProduct(productId) {
  const product = await productRepository.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const existing = await qrCodeRepository.findByProductId(productId);
  if (existing) return existing;

  return generate(productId);
}

export async function generate(productId) {
  const product = await productRepository.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const existing = await qrCodeRepository.findByProductId(productId);
  const version = (existing?.regenerated_count || 0) + 1;
  const filename = `product-${productId}-v${version}.png`;
  const filePath = path.join(QR_DIR, filename);

  const payload = buildPayload(product);
  await QRCode.toFile(filePath, JSON.stringify(payload), { width: 320, margin: 2 });

  if (existing) {
    const oldFilePath = path.join(UPLOADS_ROOT, existing.qr_path.replace('/uploads/', ''));
    fs.unlink(oldFilePath).catch(() => {
      // Old file already gone or inaccessible — not fatal.
    });
  }

  const qrPath = publicPathFor('qrcodes', filename);
  return qrCodeRepository.upsert(productId, qrPath, payload);
}
