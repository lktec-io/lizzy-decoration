import { ApiError } from '../utils/apiError.js';
import * as expenseCategoryRepository from '../repositories/expenseCategory.repository.js';
import * as activityLogRepository from '../repositories/activityLog.repository.js';

export async function listExpenseCategories(query) {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);

  const { rows, total } = await expenseCategoryRepository.findAll({ page, limit, search: query.search });

  return { items: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function assertUniqueName(name, excludeId = null) {
  const conflict = await expenseCategoryRepository.findByName(name);
  if (conflict && conflict.id !== excludeId) {
    throw new ApiError(409, 'An expense category with this name already exists');
  }
}

export async function createExpenseCategory(data, actorId) {
  await assertUniqueName(data.name);
  const category = await expenseCategoryRepository.create({ name: data.name });
  await activityLogRepository.create({
    userId: actorId,
    branchId: null,
    description: `Expense category "${category.name}" created`,
    referenceType: 'expense_category',
    referenceId: category.id,
  });
  return category;
}

export async function updateExpenseCategory(id, data, actorId) {
  const existing = await expenseCategoryRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Expense category not found');

  await assertUniqueName(data.name, id);
  const category = await expenseCategoryRepository.update(id, { name: data.name });
  await activityLogRepository.create({
    userId: actorId,
    branchId: null,
    description: `Expense category "${category.name}" updated`,
    referenceType: 'expense_category',
    referenceId: id,
  });
  return category;
}

export async function deleteExpenseCategory(id, actorId) {
  const existing = await expenseCategoryRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Expense category not found');

  const expenseCount = await expenseCategoryRepository.countExpenses(id);
  if (expenseCount > 0) {
    throw new ApiError(409, `Cannot delete this category — ${expenseCount} expense(s) still reference it`);
  }

  await expenseCategoryRepository.softDelete(id);
  await activityLogRepository.create({
    userId: actorId,
    branchId: null,
    description: `Expense category "${existing.name}" deleted`,
    referenceType: 'expense_category',
    referenceId: id,
  });
}
