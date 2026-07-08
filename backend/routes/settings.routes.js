import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();

router.use(authenticate, authorize('settings.view'));

router.get('/system', settingsController.getSystemSettings);
router.put('/system', authorize('settings.manage'), settingsController.updateSystemSettings);
router.get('/backups', settingsController.listBackups);
router.post('/backups', authorize('settings.manage'), settingsController.createBackup);
router.get('/backups/:id/download', authorize('settings.manage'), settingsController.downloadBackup);

export default router;
