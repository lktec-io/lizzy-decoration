import { Router } from 'express';
import * as purchaseController from '../controllers/purchase.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createPurchaseValidator, paymentValidator } from '../validators/purchase.validator.js';

const router = Router();

router.use(authenticate, authorize('purchases.view'));

router.get('/', purchaseController.list);
router.get('/:id', purchaseController.getById);
router.post('/', authorize('purchases.create'), createPurchaseValidator, validateRequest, purchaseController.create);
router.post('/payments', authorize('purchases.manage'), paymentValidator, validateRequest, purchaseController.addPayment);

export default router;
