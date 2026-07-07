import { Router } from 'express';
import * as branchController from '../controllers/branch.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { branchValidator, changeStatusValidator } from '../validators/branch.validator.js';

const router = Router();

router.use(authenticate);

// Lightweight lookup for dropdowns (any authenticated user).
router.get('/active', branchController.listActive);

router.get('/', authorize('branches.view'), branchController.list);
router.get('/:id', authorize('branches.view'), branchController.getById);
router.post('/', authorize('branches.create'), branchValidator, validateRequest, branchController.create);
router.put('/:id', authorize('branches.edit'), branchValidator, validateRequest, branchController.update);
router.patch('/:id/status', authorize('branches.edit'), changeStatusValidator, validateRequest, branchController.changeStatus);

export default router;
