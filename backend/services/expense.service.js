import { ApiError } from '../utils/apiError.js';
import { getAccessibleBranchIds } from '../utils/branchScope.js';
import * as expenseRepository from '../repositories/expense.repository.js';
import * as expenseCategoryRepository from '../repositories/expenseCategory.repository.js';
import * as branchRepository from '../repositories/branch.repository.js';
import * as activityLogRepository from '../repositories/activityLog.repository.js';
import * as notificationRepository from '../repositories/notification.repository.js';
import { formatCurrency } from '../utils/formatCurrency.js';

async function assertBranchAccess(user, branchId) {
  const branchIds = await getAccessibleBranchIds(user);
  if (branchIds !== null && !branchIds.includes(branchId)) {
    throw new ApiError(403, 'You do not have access to this branch');
  }
}

export async function listExpenses(query, user) {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const branchIds = await getAccessibleBranchIds(user);

  const { rows, total, totalAmount } = await expenseRepository.findAll({
    page,
    limit,
    search: query.search,
    categoryId: query.categoryId ? Number(query.categoryId) : undefined,
    branchId: query.branchId ? Number(query.branchId) : undefined,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    branchIds,
  });

  return { items: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit), totalAmount } };
}

export async function getExpense(id) {
  const expense = await expenseRepository.findById(id);
  if (!expense) throw new ApiError(404, 'Expense not found');
  return expense;
}

export async function createExpense(data, actorId, user) {
  const branchId = Number(data.branchId);
  const branch = await branchRepository.findById(branchId);
  if (!branch) throw new ApiError(400, 'Selected branch does not exist');
  await assertBranchAccess(user, branchId);

  const category = await expenseCategoryRepository.findById(data.expenseCategoryId);
  if (!category) throw new ApiError(400, 'Selected expense category does not exist');

  const expense = await expenseRepository.create({
    expenseCategoryId: data.expenseCategoryId,
    branchId,
    amount: data.amount,
    description: data.description,
    expenseDate: data.expenseDate,
    userId: actorId,
  });

  await activityLogRepository.create({
    userId: actorId,
    branchId,
    description: `Expense of ${category.name} (${data.amount}) recorded at "${branch.name}"`,
    referenceType: 'expense',
    referenceId: expense.id,
  });

  await notificationRepository.notifyBranchManagement(branchId, {
    type: 'info',
    category: 'expense_submitted',
    title: 'Expense recorded',
    message: `${category.name} expense of ${formatCurrency(data.amount)} recorded at "${branch.name}"`,
    referenceType: 'expense',
    referenceId: expense.id,
  });

  return expense;
}

export async function updateExpense(id, data, actorId, user) {
  const existing = await expenseRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Expense not found');
  await assertBranchAccess(user, existing.branch_id);

  const branchId = Number(data.branchId);
  const branch = await branchRepository.findById(branchId);
  if (!branch) throw new ApiError(400, 'Selected branch does not exist');
  await assertBranchAccess(user, branchId);

  const category = await expenseCategoryRepository.findById(data.expenseCategoryId);
  if (!category) throw new ApiError(400, 'Selected expense category does not exist');

  const expense = await expenseRepository.update(id, {
    expenseCategoryId: data.expenseCategoryId,
    branchId,
    amount: data.amount,
    description: data.description,
    expenseDate: data.expenseDate,
    userId: actorId,
  });

  await activityLogRepository.create({
    userId: actorId,
    branchId,
    description: `Expense "${expense.id}" updated`,
    referenceType: 'expense',
    referenceId: id,
  });

  return expense;
}

export async function deleteExpense(id, actorId, user) {
  const existing = await expenseRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Expense not found');
  await assertBranchAccess(user, existing.branch_id);

  await expenseRepository.softDelete(id, actorId);

  await activityLogRepository.create({
    userId: actorId,
    branchId: existing.branch_id,
    description: `Expense of ${existing.category_name} (${existing.amount}) deleted`,
    referenceType: 'expense',
    referenceId: id,
  });
}
