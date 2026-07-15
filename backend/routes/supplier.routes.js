import { Router } from 'express';
import * as supplierController from '../controllers/supplier.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { supplierValidator, changeStatusValidator } from '../validators/supplier.validator.js';

const router = Router();

router.use(authenticate);

router.get('/active', supplierController.listActive);
router.get('/', authorize('suppliers.view'), supplierController.list);
router.get('/:id', authorize('suppliers.view'), supplierController.getById);
router.get('/:id/purchases', authorize('suppliers.view'), supplierController.purchaseHistory);
router.post('/', authorize('suppliers.create'), supplierValidator, validateRequest, supplierController.create);
router.put('/:id', authorize('suppliers.edit'), supplierValidator, validateRequest, supplierController.update);
router.patch('/:id/status', authorize('suppliers.edit'), changeStatusValidator, validateRequest, supplierController.changeStatus);
router.delete('/:id', authorize('suppliers.delete'), supplierController.remove);

export default router;
