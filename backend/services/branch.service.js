import { ApiError } from '../utils/apiError.js';
import * as branchRepository from '../repositories/branch.repository.js';
import * as activityLogRepository from '../repositories/activityLog.repository.js';

export async function listBranches(query) {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);

  const { rows, total } = await branchRepository.findAll({
    page,
    limit,
    search: query.search,
    status: query.status,
  });

  return { items: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getBranch(id) {
  const branch = await branchRepository.findById(id);
  if (!branch) throw new ApiError(404, 'Branch not found');
  return branch;
}

async function assertUniqueCode(code, excludeId = null) {
  const existing = await branchRepository.findByCode(code);
  if (existing && existing.id !== excludeId) {
    throw new ApiError(409, 'A branch with this code already exists');
  }
}

export async function createBranch(data, actorId) {
  await assertUniqueCode(data.code);

  const branch = await branchRepository.create({ ...data, userId: actorId });
  await activityLogRepository.create({
    userId: actorId,
    branchId: branch.id,
    description: `Branch "${branch.name}" created`,
    referenceType: 'branch',
    referenceId: branch.id,
  });
  return branch;
}

export async function updateBranch(id, data, actorId) {
  const existing = await branchRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Branch not found');

  await assertUniqueCode(data.code, id);

  const branch = await branchRepository.update(id, { ...data, userId: actorId });
  await activityLogRepository.create({
    userId: actorId,
    branchId: id,
    description: `Branch "${branch.name}" updated`,
    referenceType: 'branch',
    referenceId: id,
  });
  return branch;
}

export async function changeStatus(id, status, actorId) {
  const existing = await branchRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Branch not found');

  if (status === 'inactive') {
    const usersAssigned = await branchRepository.countUsersAssigned(id);
    if (usersAssigned > 0) {
      throw new ApiError(409, `Cannot deactivate this branch — ${usersAssigned} user(s) are still assigned to it`);
    }
  }

  const branch = await branchRepository.updateStatus(id, status, actorId);
  await activityLogRepository.create({
    userId: actorId,
    branchId: id,
    description: `Branch "${existing.name}" status changed to ${status}`,
    referenceType: 'branch',
    referenceId: id,
  });
  return branch;
}
