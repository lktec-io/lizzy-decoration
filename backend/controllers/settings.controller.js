import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';
import * as systemSettingsService from '../services/systemSettings.service.js';
import * as backupService from '../services/backup.service.js';
import * as expenseCategoryService from '../services/expenseCategory.service.js';
import * as carwashServiceService from '../services/carwashService.service.js';

export const getSystemSettings = asyncHandler(async (req, res) => {
  const settings = await systemSettingsService.getSettings();
  return success(res, { data: settings });
});

export const updateSystemSettings = asyncHandler(async (req, res) => {
  const settings = await systemSettingsService.updateSettings(req.body, req.user.id);
  return success(res, { message: 'Settings updated', data: settings });
});

export const listBackups = asyncHandler(async (req, res) => {
  const { items, meta } = await backupService.listBackups(req.query);
  return success(res, { data: { items, meta } });
});

export const createBackup = asyncHandler(async (req, res) => {
  const backup = await backupService.createBackup(req.user.id);
  return success(res, { message: 'Backup completed', data: backup, status: 201 });
});

export const downloadBackup = asyncHandler(async (req, res) => {
  const { filePath, filename } = await backupService.getBackupFilePath(Number(req.params.id));
  res.download(filePath, filename);
});

export const listExpenseCategories = asyncHandler(async (req, res) => {
  const { items, meta } = await expenseCategoryService.listExpenseCategories(req.query);
  return success(res, { data: { items, meta } });
});

export const createExpenseCategory = asyncHandler(async (req, res) => {
  const category = await expenseCategoryService.createExpenseCategory(req.body, req.user.id);
  return success(res, { message: 'Expense category created', data: category, status: 201 });
});

export const updateExpenseCategory = asyncHandler(async (req, res) => {
  const category = await expenseCategoryService.updateExpenseCategory(Number(req.params.id), req.body, req.user.id);
  return success(res, { message: 'Expense category updated', data: category });
});

export const deleteExpenseCategory = asyncHandler(async (req, res) => {
  await expenseCategoryService.deleteExpenseCategory(Number(req.params.id), req.user.id);
  return success(res, { message: 'Expense category deleted' });
});

export const listCarwashServices = asyncHandler(async (req, res) => {
  const { items, meta } = await carwashServiceService.listCarwashServices(req.query);
  return success(res, { data: { items, meta } });
});

export const createCarwashService = asyncHandler(async (req, res) => {
  const service = await carwashServiceService.createCarwashService(req.body, req.user.id);
  return success(res, { message: 'Car wash package created', data: service, status: 201 });
});

export const updateCarwashService = asyncHandler(async (req, res) => {
  const service = await carwashServiceService.updateCarwashService(Number(req.params.id), req.body, req.user.id);
  return success(res, { message: 'Car wash package updated', data: service });
});

export const setCarwashServiceStatus = asyncHandler(async (req, res) => {
  const service = await carwashServiceService.setCarwashServiceStatus(Number(req.params.id), req.body.status, req.user.id);
  return success(res, { message: 'Car wash package status updated', data: service });
});
