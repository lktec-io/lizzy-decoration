import { Router } from 'express';
import * as auditLogController from '../controllers/auditLog.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();

// audit.view alone gates the whole feature — Super Administrator and
// Manager only (see seeders/008_add_audit_permission.sql). Cashier and
// Store Keeper have no audit.view grant, so authorize() 403s them before
// any handler runs.
router.use(authenticate, authorize('audit.view'));

router.get('/', auditLogController.list);
router.get('/filter-options', auditLogController.filterOptions);
router.get('/export/pdf', auditLogController.exportPdf);
router.get('/export/excel', auditLogController.exportExcel);
router.get('/export/csv', auditLogController.exportCsv);

export default router;
