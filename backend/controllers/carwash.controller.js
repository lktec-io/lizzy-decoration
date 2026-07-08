import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';
import * as carwashService from '../services/carwash.service.js';
import * as carwashServiceRepository from '../repositories/carwashService.repository.js';

export const listServices = asyncHandler(async (req, res) => {
  const services = await carwashServiceRepository.findAllActive();
  return success(res, { data: services });
});

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await carwashService.listTransactions(req.query, req.user);
  return success(res, { data: { items, meta } });
});

export const create = asyncHandler(async (req, res) => {
  const transaction = await carwashService.recordTransaction(req.body, req.user.id, req.user);
  return success(res, { message: 'Car wash recorded', data: transaction, status: 201 });
});
