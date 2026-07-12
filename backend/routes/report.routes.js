import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();

router.use(authenticate, authorize('reports.view'));

router.get('/:type/export/pdf', authorize('reports.export'), reportController.exportPdf);
router.get('/:type', reportController.getReport);

export default router;
