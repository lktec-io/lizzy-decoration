import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { categoryValidator } from '../validators/category.validator.js';

const router = Router();

router.use(authenticate);

router.get('/active', categoryController.listActive);
router.get('/', authorize('categories.view'), categoryController.list);
router.post('/', authorize('categories.create'), categoryValidator, validateRequest, categoryController.create);
router.put('/:id', authorize('categories.edit'), categoryValidator, validateRequest, categoryController.update);
router.delete('/:id', authorize('categories.delete'), categoryController.remove);

export default router;
