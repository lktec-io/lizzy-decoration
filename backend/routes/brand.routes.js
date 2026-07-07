import { Router } from 'express';
import * as brandController from '../controllers/brand.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { brandValidator } from '../validators/brand.validator.js';

const router = Router();

router.use(authenticate);

router.get('/active', brandController.listActive);
router.get('/', authorize('brands.view'), brandController.list);
router.post('/', authorize('brands.create'), brandValidator, validateRequest, brandController.create);
router.put('/:id', authorize('brands.edit'), brandValidator, validateRequest, brandController.update);
router.delete('/:id', authorize('brands.delete'), brandController.remove);

export default router;
