import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();

router.use(authenticate, authorize('dashboard.view'));

router.get('/kpis', dashboardController.getKpis);
router.get('/charts/:type', dashboardController.getChart);
router.get('/activity', dashboardController.getActivity);

export default router;
