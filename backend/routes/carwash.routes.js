import { Router } from 'express';
import * as carwashController from '../controllers/carwash.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { recordTransactionValidator } from '../validators/carwash.validator.js';

const router = Router();

router.use(authenticate, authorize('carwash.view'));

router.get('/services', carwashController.listServices);
router.get('/', carwashController.list);
router.post('/', authorize('carwash.create'), recordTransactionValidator, validateRequest, carwashController.create);

export default router;
