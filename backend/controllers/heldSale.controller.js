import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';
import * as heldSaleService from '../services/heldSale.service.js';

export const list = asyncHandler(async (req, res) => {
  const items = await heldSaleService.listHeldSales(req.query, req.user);
  return success(res, { data: items });
});

export const getById = asyncHandler(async (req, res) => {
  const held = await heldSaleService.getHeldSale(Number(req.params.id), req.user);
  return success(res, { data: held });
});

export const hold = asyncHandler(async (req, res) => {
  const held = await heldSaleService.holdSale(req.body, req.user.id, req.user);
  return success(res, { message: 'Sale held', data: held, status: 201 });
});

export const remove = asyncHandler(async (req, res) => {
  await heldSaleService.deleteHeldSale(Number(req.params.id), req.user);
  return success(res, { message: 'Held sale deleted' });
});
