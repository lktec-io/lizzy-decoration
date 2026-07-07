import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';
import * as inventoryService from '../services/inventory.service.js';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await inventoryService.listInventory(req.query, req.user);
  return success(res, { data: { items, meta } });
});

export const summary = asyncHandler(async (req, res) => {
  const data = await inventoryService.getSummary(req.user);
  return success(res, { data });
});

export const movements = asyncHandler(async (req, res) => {
  const { items, meta } = await inventoryService.listMovements(req.query, req.user);
  return success(res, { data: { items, meta } });
});

export const createAdjustment = asyncHandler(async (req, res) => {
  const result = await inventoryService.createAdjustment(req.body, req.user);
  return success(res, { message: 'Stock adjustment recorded', data: result, status: 201 });
});
