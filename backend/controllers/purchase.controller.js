import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';
import * as purchaseService from '../services/purchase.service.js';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await purchaseService.listPurchases(req.query, req.user);
  return success(res, { data: { items, meta } });
});

export const getById = asyncHandler(async (req, res) => {
  const purchase = await purchaseService.getPurchase(Number(req.params.id));
  return success(res, { data: purchase });
});

export const create = asyncHandler(async (req, res) => {
  const purchase = await purchaseService.createPurchase(req.body, req.user.id);
  return success(res, { message: 'Purchase recorded and inventory updated', data: purchase, status: 201 });
});

export const addPayment = asyncHandler(async (req, res) => {
  await purchaseService.addPayment(req.body, req.user.id);
  return success(res, { message: 'Payment recorded', status: 201 });
});
