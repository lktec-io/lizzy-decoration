import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { ApiError } from '../utils/apiError.js';
import * as productRepository from '../repositories/product.repository.js';
import * as categoryRepository from '../repositories/category.repository.js';
import * as brandRepository from '../repositories/brand.repository.js';
import * as activityLogRepository from '../repositories/activityLog.repository.js';
import { generateCode } from '../repositories/sequence.repository.js';
import { resolveUploadedFileUrl, deleteUploadedFile } from '../middlewares/upload.js';
import { getAccessibleBranchIds } from '../utils/branchScope.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

export async function listProducts(query) {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);

  const { rows, total } = await productRepository.findAll({
    page,
    limit,
    search: query.search,
    categoryId: query.categoryId ? Number(query.categoryId) : undefined,
    brandId: query.brandId ? Number(query.brandId) : undefined,
    status: query.status,
  });

  return { items: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getProduct(id) {
  const product = await productRepository.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
}

// Backs the POS product grid — active products with their live stock at one
// branch. Branch-scoped the same way every other branch-owned read is.
export async function getSellableProducts(query, user) {
  if (!query.branchId) throw new ApiError(400, 'Branch is required');
  const branchId = Number(query.branchId);

  const branchIds = await getAccessibleBranchIds(user);
  if (branchIds !== null && !branchIds.includes(branchId)) {
    throw new ApiError(403, 'You do not have access to this branch');
  }

  return productRepository.findSellable({
    branchId,
    search: query.search,
    categoryId: query.categoryId ? Number(query.categoryId) : undefined,
    limit: Math.min(Number(query.limit) || 60, 200),
  });
}

// The barcode scanner's only lookup — exact match, not the fuzzy `search`
// findSellable() does for the product grid. Returns null (not a 404) on no
// match: "barcode doesn't resolve to a product" is an ordinary, expected
// outcome of scanning, not an error condition.
export async function getSellableProductByCode(query, user) {
  if (!query.branchId) throw new ApiError(400, 'Branch is required');
  if (!query.code) throw new ApiError(400, 'Code is required');
  const branchId = Number(query.branchId);

  const branchIds = await getAccessibleBranchIds(user);
  if (branchIds !== null && !branchIds.includes(branchId)) {
    throw new ApiError(403, 'You do not have access to this branch');
  }

  return productRepository.findSellableByCode({ code: query.code.trim(), branchId });
}

function assertPriceSanity(data) {
  if (Number(data.buyingPrice) > Number(data.sellingPrice) && !data.confirmPriceOverride) {
    throw new ApiError(
      422,
      'Buying price is higher than selling price. Confirm this is intentional to proceed.',
      [{ field: 'sellingPrice', message: 'PRICE_OVERRIDE_REQUIRED' }],
    );
  }
}

export async function createProduct(data, actorId) {
  const category = await categoryRepository.findById(data.categoryId);
  if (!category) throw new ApiError(400, 'Selected category does not exist');

  // Brand is optional — only validated (must reference a real row) when
  // the caller actually sent one, not required to be present at all.
  if (data.brandId) {
    const brand = await brandRepository.findById(data.brandId);
    if (!brand) throw new ApiError(400, 'Selected brand does not exist');
  }

  assertPriceSanity(data);

  const code = await generateCode(`PRODUCT_${category.code}`, category.code);

  const product = await productRepository.create({ ...data, code, userId: actorId });
  await activityLogRepository.create({
    userId: actorId,
    branchId: null,
    description: `Product "${product.name}" (${product.code}) created`,
    referenceType: 'product',
    referenceId: product.id,
  });
  return product;
}

export async function updateProduct(id, data, actorId) {
  const existing = await productRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Product not found');

  const category = await categoryRepository.findById(data.categoryId);
  if (!category) throw new ApiError(400, 'Selected category does not exist');

  if (data.brandId) {
    const brand = await brandRepository.findById(data.brandId);
    if (!brand) throw new ApiError(400, 'Selected brand does not exist');
  }

  assertPriceSanity(data);

  const product = await productRepository.update(id, { ...data, userId: actorId });
  await activityLogRepository.create({
    userId: actorId,
    branchId: null,
    description: `Product "${product.name}" (${product.code}) updated`,
    referenceType: 'product',
    referenceId: id,
  });
  return product;
}

export async function bulkUpdateStatus(ids, status, actorId) {
  if (!ids?.length) throw new ApiError(400, 'No products selected');
  await productRepository.bulkUpdateStatus(ids, status, actorId);
}

// Best-effort cleanup of a product's uploaded image files before the row
// (and its product_images rows, via ON DELETE CASCADE) is actually
// removed — otherwise a hard delete leaves orphaned files on disk/Cloudinary
// with nothing left in the DB to ever clean them up later. Mirrors
// removeImage()'s per-file cleanup below; never throws, since a failed file
// cleanup shouldn't block the delete itself.
async function cleanupProductImageFiles(images) {
  await Promise.all((images || []).map(async (image) => {
    try {
      if (image.image_path.startsWith('/uploads/')) {
        await fs.unlink(path.join(UPLOADS_ROOT, image.image_path.replace('/uploads/', '')));
      } else {
        await deleteUploadedFile(image.image_path);
      }
    } catch {
      // Already gone, inaccessible, or a Cloudinary failure already logged
      // inside deleteUploadedFile — not fatal to the product delete itself.
    }
  }));
}

// A product with real sales/purchase/inventory history can never be hard
// deleted (see hasTransactionHistory's comment) — historical records must
// stay intact, so it's archived (soft delete) instead, automatically, with
// no separate "are you sure" business-rule error to work around. Only a
// product nobody has ever transacted against is actually removed.
export async function deleteProduct(id, actorId) {
  const existing = await productRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Product not found');

  const hasHistory = await productRepository.hasTransactionHistory(id);
  if (hasHistory) {
    await productRepository.softDelete(id, actorId);
    await activityLogRepository.create({
      userId: actorId,
      branchId: null,
      description: `Product "${existing.name}" (${existing.code}) archived — has sales, purchase, or inventory history`,
      referenceType: 'product',
      referenceId: id,
    });
    return { archived: true };
  }

  try {
    await productRepository.hardDelete(id);
  } catch (err) {
    // The pre-check said safe, but a concurrent purchase/sale/adjustment
    // referenced this product between the check and the delete — archive
    // rather than surface the raw FK error, staying consistent with the
    // "history means archive, not delete" rule instead of just failing.
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      await productRepository.softDelete(id, actorId);
      await activityLogRepository.create({
        userId: actorId,
        branchId: null,
        description: `Product "${existing.name}" (${existing.code}) archived — has sales, purchase, or inventory history`,
        referenceType: 'product',
        referenceId: id,
      });
      return { archived: true };
    }
    throw err;
  }

  await cleanupProductImageFiles(existing.images);
  await activityLogRepository.create({
    userId: actorId,
    branchId: null,
    description: `Product "${existing.name}" (${existing.code}) permanently deleted`,
    referenceType: 'product',
    referenceId: id,
  });
  return { archived: false };
}

export async function listArchivedProducts(query) {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);

  const { rows, total } = await productRepository.findAllArchived({ page, limit, search: query.search });
  return { items: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function restoreProduct(id, actorId) {
  const existing = await productRepository.findArchivedById(id);
  if (!existing) throw new ApiError(404, 'Archived product not found');

  const restored = await productRepository.restore(id, actorId);
  await activityLogRepository.create({
    userId: actorId,
    branchId: null,
    description: `Product "${existing.name}" (${existing.code}) restored from archive`,
    referenceType: 'product',
    referenceId: id,
  });
  return restored;
}

// The archive page's own delete — distinct from deleteProduct() above
// because it must NEVER silently re-archive an already-archived product.
// Re-checks history at this moment (not just at the original archive time)
// since "safe to permanently delete" can only ever be answered right now.
export async function permanentlyDeleteProduct(id, actorId) {
  const existing = await productRepository.findArchivedById(id);
  if (!existing) throw new ApiError(404, 'Archived product not found');

  const hasHistory = await productRepository.hasTransactionHistory(id);
  if (hasHistory) {
    throw new ApiError(
      409,
      `Cannot permanently delete "${existing.name}" — it still has sales, purchase, or inventory history that must be preserved.`,
    );
  }

  try {
    await productRepository.hardDelete(id);
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      throw new ApiError(409, `Cannot permanently delete "${existing.name}" — other records still reference it.`);
    }
    throw err;
  }

  await cleanupProductImageFiles(existing.images);
  await activityLogRepository.create({
    userId: actorId,
    branchId: null,
    description: `Product "${existing.name}" (${existing.code}) permanently deleted from archive`,
    referenceType: 'product',
    referenceId: id,
  });
}

export async function addImage(productId, file, isPrimary) {
  const product = await productRepository.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const imagePath = resolveUploadedFileUrl(file, 'products');
  const shouldBePrimary = isPrimary || product.images.length === 0;
  await productRepository.addImage(productId, imagePath, shouldBePrimary);
  return productRepository.findById(productId);
}

export async function removeImage(productId, imageId) {
  const image = await productRepository.findImageById(imageId);
  if (!image || image.product_id !== productId) {
    throw new ApiError(404, 'Image not found');
  }

  await productRepository.removeImage(imageId, productId);

  if (image.image_path.startsWith('/uploads/')) {
    const filePath = path.join(UPLOADS_ROOT, image.image_path.replace('/uploads/', ''));
    fs.unlink(filePath).catch(() => {
      // File already gone or inaccessible — not fatal.
    });
  } else {
    deleteUploadedFile(image.image_path).catch(() => {
      // Cloudinary cleanup failures are already logged inside deleteUploadedFile — not fatal.
    });
  }

  return productRepository.findById(productId);
}
