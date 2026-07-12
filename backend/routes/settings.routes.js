import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { expenseCategoryValidator } from '../validators/expenseCategory.validator.js';
import { manageCarwashServiceValidator } from '../validators/carwash.validator.js';

const router = Router();

router.use(authenticate, authorize('settings.view'));

router.get('/system', settingsController.getSystemSettings);
router.put('/system', authorize('settings.manage'), settingsController.updateSystemSettings);
router.get('/backups', settingsController.listBackups);
router.post('/backups', authorize('settings.manage'), settingsController.createBackup);
router.get('/backups/:id/download', authorize('settings.manage'), settingsController.downloadBackup);

router.get('/expense-categories', settingsController.listExpenseCategories);
router.post('/expense-categories', authorize('settings.manage'), expenseCategoryValidator, validateRequest, settingsController.createExpenseCategory);
router.put('/expense-categories/:id', authorize('settings.manage'), expenseCategoryValidator, validateRequest, settingsController.updateExpenseCategory);
router.delete('/expense-categories/:id', authorize('settings.manage'), settingsController.deleteExpenseCategory);

router.get('/carwash-services', settingsController.listCarwashServices);
router.post('/carwash-services', authorize('settings.manage'), manageCarwashServiceValidator, validateRequest, settingsController.createCarwashService);
router.put('/carwash-services/:id', authorize('settings.manage'), manageCarwashServiceValidator, validateRequest, settingsController.updateCarwashService);
router.patch('/carwash-services/:id/status', authorize('settings.manage'), settingsController.setCarwashServiceStatus);

export default router;
