import { ApiError } from '../utils/apiError.js';
import * as categoryRepository from '../repositories/category.repository.js';
import * as activityLogRepository from '../repositories/activityLog.repository.js';

export async function listCategories(query) {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);

  const { rows, total } = await categoryRepository.findAll({
    page,
    limit,
    search: query.search,
    status: query.status,
  });

  return { items: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function assertUnique({ name, code }, excludeId = null) {
  const nameConflict = await categoryRepository.findByName(name);
  if (nameConflict && nameConflict.id !== excludeId) {
    throw new ApiError(409, 'A category with this name already exists');
  }
  const codeConflict = await categoryRepository.findByCode(code);
  if (codeConflict && codeConflict.id !== excludeId) {
    throw new ApiError(409, 'A category with this code already exists');
  }
}

export async function createCategory(data, actorId) {
  await assertUnique(data);
  const category = await categoryRepository.create({ ...data, userId: actorId });
  await activityLogRepository.create({
    userId: actorId,
    branchId: null,
    description: `Category "${category.name}" created`,
    referenceType: 'category',
    referenceId: category.id,
  });
  return category;
}

export async function updateCategory(id, data, actorId) {
  const existing = await categoryRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Category not found');

  await assertUnique(data, id);
  const category = await categoryRepository.update(id, { ...data, userId: actorId });
  await activityLogRepository.create({
    userId: actorId,
    branchId: null,
    description: `Category "${category.name}" updated`,
    referenceType: 'category',
    referenceId: id,
  });
  return category;
}

export async function deleteCategory(id, actorId) {
  const existing = await categoryRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Category not found');

  const productCount = await categoryRepository.countProducts(id);
  if (productCount > 0) {
    throw new ApiError(409, `Cannot delete this category — ${productCount} product(s) still reference it`);
  }

  await categoryRepository.softDelete(id, actorId);
  await activityLogRepository.create({
    userId: actorId,
    branchId: null,
    description: `Category "${existing.name}" deleted`,
    referenceType: 'category',
    referenceId: id,
  });
}
