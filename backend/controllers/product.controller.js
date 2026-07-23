import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import * as productService from '../services/product.service.js';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await productService.listProducts(req.query);
  return success(res, { data: { items, meta } });
});

export const sellable = asyncHandler(async (req, res) => {
  const products = await productService.getSellableProducts(req.query, req.user);
  return success(res, { data: products });
});

export const lookupSellable = asyncHandler(async (req, res) => {
  const product = await productService.getSellableProductByCode(req.query, req.user);
  return success(res, { data: product });
});

export const getById = asyncHandler(async (req, res) => {
  const product = await productService.getProduct(Number(req.params.id));
  return success(res, { data: product });
});

export const create = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.user.id);
  return success(res, { message: 'Product created', data: product, status: 201 });
});

export const update = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(Number(req.params.id), req.body, req.user.id);
  return success(res, { message: 'Product updated', data: product });
});

export const bulkStatus = asyncHandler(async (req, res) => {
  await productService.bulkUpdateStatus(req.body.ids, req.body.status, req.user.id);
  return success(res, { message: 'Products updated' });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(Number(req.params.id), req.user.id);
  const message = result.archived
    ? 'Product archived — it has sales, purchase, or inventory history that must be preserved'
    : 'Product permanently deleted';
  return success(res, { message, data: result });
});

export const listArchived = asyncHandler(async (req, res) => {
  const { items, meta } = await productService.listArchivedProducts(req.query);
  return success(res, { data: { items, meta } });
});

export const restore = asyncHandler(async (req, res) => {
  const product = await productService.restoreProduct(Number(req.params.id), req.user.id);
  return success(res, { message: 'Product restored', data: product });
});

export const permanentDelete = asyncHandler(async (req, res) => {
  await productService.permanentlyDeleteProduct(Number(req.params.id), req.user.id);
  return success(res, { message: 'Product permanently deleted' });
});

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No image file uploaded');
  }
  const product = await productService.addImage(Number(req.params.id), req.file, req.body.isPrimary === 'true');
  return success(res, { message: 'Image uploaded', data: product });
});

export const removeImage = asyncHandler(async (req, res) => {
  const product = await productService.removeImage(Number(req.params.id), Number(req.params.imageId));
  return success(res, { message: 'Image removed', data: product });
});
