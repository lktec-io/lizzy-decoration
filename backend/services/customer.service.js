import { ApiError } from '../utils/apiError.js';
import { generateCode } from '../repositories/sequence.repository.js';
import * as customerRepository from '../repositories/customer.repository.js';
import * as activityLogRepository from '../repositories/activityLog.repository.js';

export async function listCustomers(query) {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);

  const { rows, total } = await customerRepository.findAll({
    page, limit, search: query.search, customerType: query.customerType, status: query.status,
  });

  return { items: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

// Purchase/return history and lifetime stats are real queries against the
// `sales`/`returns` tables — those tables exist from Phase 0 but have no
// rows until Phases 17/18 ship, so this correctly returns empty/zero today
// and "lights up" automatically once POS and Returns are built, with no
// rework needed here.
export async function getCustomer(id) {
  const customer = await customerRepository.findById(id);
  if (!customer) throw new ApiError(404, 'Customer not found');

  const stats = await customerRepository.getStatistics(id);
  return { ...customer, ...stats };
}

export async function getPurchaseHistory(id, query) {
  const customer = await customerRepository.findById(id);
  if (!customer) throw new ApiError(404, 'Customer not found');

  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const { rows, total } = await customerRepository.findPurchaseHistory(id, { page, limit });

  return { items: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getReturnHistory(id, query) {
  const customer = await customerRepository.findById(id);
  if (!customer) throw new ApiError(404, 'Customer not found');

  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const { rows, total } = await customerRepository.findReturnHistory(id, { page, limit });

  return { items: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createCustomer(data, actorId) {
  const customerCode = await generateCode('CUSTOMER', 'CUST');
  const customer = await customerRepository.create({ ...data, customerCode, userId: actorId });

  await activityLogRepository.create({
    userId: actorId,
    branchId: null,
    description: `Customer "${customerCode}" (${customer.first_name} ${customer.last_name}) created`,
    referenceType: 'customer',
    referenceId: customer.id,
  });

  return customer;
}

export async function updateCustomer(id, data, actorId) {
  const existing = await customerRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Customer not found');

  const customer = await customerRepository.update(id, { ...data, userId: actorId });

  await activityLogRepository.create({
    userId: actorId,
    branchId: null,
    description: `Customer "${customer.customer_code}" updated`,
    referenceType: 'customer',
    referenceId: id,
  });

  return customer;
}

export async function changeStatus(id, status, actorId) {
  const existing = await customerRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Customer not found');

  const customer = await customerRepository.updateStatus(id, status, actorId);

  await activityLogRepository.create({
    userId: actorId,
    branchId: null,
    description: `Customer "${existing.customer_code}" status changed to ${status}`,
    referenceType: 'customer',
    referenceId: id,
  });

  return customer;
}

export async function deleteCustomer(id, actorId) {
  const existing = await customerRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Customer not found');

  try {
    await customerRepository.hardDelete(id);
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      throw new ApiError(409, 'Cannot delete this customer — related records still reference them.');
    }
    throw err;
  }

  await activityLogRepository.create({
    userId: actorId,
    branchId: null,
    description: `Customer "${existing.customer_code}" (${existing.first_name} ${existing.last_name}) permanently deleted`,
    referenceType: 'customer',
    referenceId: id,
  });
}
