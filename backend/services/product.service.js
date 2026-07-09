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

  const brand = await brandRepository.findById(data.brandId);
  if (!brand) throw new ApiError(400, 'Selected brand does not exist');

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

  const brand = await brandRepository.findById(data.brandId);
  if (!brand) throw new ApiError(400, 'Selected brand does not exist');

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

export async function deleteProduct(id, actorId) {
  const existing = await productRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Product not found');

  const hasHistory = await productRepository.hasTransactionHistory(id);
  if (hasHistory) {
    throw new ApiError(409, 'Cannot delete a product with existing sales or purchase history — deactivate it instead');
  }

  await productRepository.softDelete(id, actorId);
  await activityLogRepository.create({
    userId: actorId,
    branchId: null,
    description: `Product "${existing.name}" (${existing.code}) deleted`,
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
