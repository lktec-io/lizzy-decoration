import { ApiError } from '../utils/apiError.js';
import * as carwashServiceRepository from '../repositories/carwashService.repository.js';
import * as activityLogRepository from '../repositories/activityLog.repository.js';

export async function listCarwashServices(query) {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);

  const { rows, total } = await carwashServiceRepository.findAll({ page, limit, search: query.search });

  return { items: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function assertUniqueName(name, excludeId = null) {
  const conflict = await carwashServiceRepository.findByName(name);
  if (conflict && conflict.id !== excludeId) {
    throw new ApiError(409, 'A car wash package with this name already exists');
  }
}

export async function createCarwashService(data, actorId) {
  await assertUniqueName(data.name);
  const service = await carwashServiceRepository.create({ name: data.name, price: data.price });
  await activityLogRepository.create({
    userId: actorId,
    branchId: null,
    description: `Car wash package "${service.name}" created`,
    referenceType: 'carwash_service',
    referenceId: service.id,
  });
  return service;
}

export async function updateCarwashService(id, data, actorId) {
  const existing = await carwashServiceRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Car wash package not found');

  await assertUniqueName(data.name, id);
  const service = await carwashServiceRepository.update(id, {
    name: data.name,
    price: data.price,
    status: data.status || existing.status,
  });
  await activityLogRepository.create({
    userId: actorId,
    branchId: null,
    description: `Car wash package "${service.name}" updated`,
    referenceType: 'carwash_service',
    referenceId: id,
  });
  return service;
}

export async function setCarwashServiceStatus(id, status, actorId) {
  const existing = await carwashServiceRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Car wash package not found');

  const service = await carwashServiceRepository.setStatus(id, status);
  await activityLogRepository.create({
    userId: actorId,
    branchId: null,
    description: `Car wash package "${existing.name}" status changed to ${status}`,
    referenceType: 'carwash_service',
    referenceId: id,
  });
  return service;
}
