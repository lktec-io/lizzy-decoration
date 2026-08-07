import { Router } from 'express';
import * as systemMaintenanceController from '../controllers/systemMaintenance.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();

// system.reset is granted ONLY to Super Administrator (seeders/
// 009_add_system_reset_permission.sql) — the service layer additionally
// re-checks req.user.role itself (defense in depth for the single most
// destructive endpoint in the app), so this permission gate is the first
// of two independent checks, not the only one.
router.use(authenticate, authorize('system.reset'));

router.post('/production-reset', systemMaintenanceController.productionReset);

export default router;
