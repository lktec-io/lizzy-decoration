import { ApiError } from '../utils/apiError.js';
import { getAccessibleBranchIds } from '../utils/branchScope.js';
import * as vehicleRepository from '../repositories/vehicle.repository.js';
import * as carwashServiceRepository from '../repositories/carwashService.repository.js';
import * as carwashTransactionRepository from '../repositories/carwashTransaction.repository.js';
import * as branchRepository from '../repositories/branch.repository.js';
import * as activityLogRepository from '../repositories/activityLog.repository.js';

async function assertBranchAccess(user, branchId) {
  const branchIds = await getAccessibleBranchIds(user);
  if (branchIds !== null && !branchIds.includes(branchId)) {
    throw new ApiError(403, 'You do not have access to this branch');
  }
}

export async function listTransactions(query, user) {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const branchIds = await getAccessibleBranchIds(user);

  const { rows, total, totalAmount } = await carwashTransactionRepository.findAll({
    page,
    limit,
    search: query.search,
    serviceId: query.serviceId ? Number(query.serviceId) : undefined,
    branchId: query.branchId ? Number(query.branchId) : undefined,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    branchIds,
  });

  return { items: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit), totalAmount } };
}

// "Register Vehicle" and "Record Service" collapse into one step: a vehicle
// is found-or-created by its plate number (the stable identity across
// repeat visits) as part of recording the wash itself, matching the spec's
// simple front-desk flow rather than a separate registration screen.
export async function recordTransaction(data, actorId, user) {
  const branchId = Number(data.branchId);
  const branch = await branchRepository.findById(branchId);
  if (!branch) throw new ApiError(400, 'Selected branch does not exist');
  await assertBranchAccess(user, branchId);

  const service = await carwashServiceRepository.findById(data.serviceId);
  if (!service || service.status !== 'active') throw new ApiError(400, 'Selected service is not available');

  const plateNumber = data.plateNumber.trim().toUpperCase();
  let vehicle = await vehicleRepository.findByPlate(plateNumber);
  if (vehicle) {
    await vehicleRepository.updateContact(vehicle.id, { customerName: data.customerName, phone: data.phone });
  } else {
    vehicle = await vehicleRepository.create({ plateNumber, customerName: data.customerName, phone: data.phone });
  }

  const transaction = await carwashTransactionRepository.create({
    vehicleId: vehicle.id,
    serviceId: data.serviceId,
    branchId,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    servedBy: actorId,
  });

  await activityLogRepository.create({
    userId: actorId,
    branchId,
    description: `Car wash "${service.name}" recorded for ${plateNumber} at "${branch.name}"`,
    referenceType: 'carwash_transaction',
    referenceId: transaction.id,
  });

  return transaction;
}

export async function updateTransaction(id, data, actorId, user) {
  const existing = await carwashTransactionRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Car wash transaction not found');

  const branchId = Number(data.branchId);
  const branch = await branchRepository.findById(branchId);
  if (!branch) throw new ApiError(400, 'Selected branch does not exist');
  await assertBranchAccess(user, branchId);
  await assertBranchAccess(user, existing.branch_id);

  const service = await carwashServiceRepository.findById(data.serviceId);
  if (!service || service.status !== 'active') throw new ApiError(400, 'Selected service is not available');

  const plateNumber = data.plateNumber.trim().toUpperCase();
  let vehicle = await vehicleRepository.findByPlate(plateNumber);
  if (vehicle) {
    await vehicleRepository.updateContact(vehicle.id, { customerName: data.customerName, phone: data.phone });
  } else {
    vehicle = await vehicleRepository.create({ plateNumber, customerName: data.customerName, phone: data.phone });
  }

  const transaction = await carwashTransactionRepository.update(id, {
    vehicleId: vehicle.id,
    serviceId: data.serviceId,
    branchId,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
  });

  await activityLogRepository.create({
    userId: actorId,
    branchId,
    description: `Car wash transaction for ${plateNumber} updated`,
    referenceType: 'carwash_transaction',
    referenceId: id,
  });

  return transaction;
}

export async function deleteTransaction(id, actorId, user) {
  const existing = await carwashTransactionRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Car wash transaction not found');
  await assertBranchAccess(user, existing.branch_id);

  await carwashTransactionRepository.hardDelete(id);

  await activityLogRepository.create({
    userId: actorId,
    branchId: existing.branch_id,
    description: `Car wash transaction for ${existing.plate_number} permanently deleted`,
    referenceType: 'carwash_transaction',
    referenceId: id,
  });
}
