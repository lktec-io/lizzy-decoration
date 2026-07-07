import { Router } from 'express';
import * as roleController from '../controllers/role.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { roleValidator, setPermissionsValidator } from '../validators/role.validator.js';

const router = Router();

router.use(authenticate);

// Read-only lookup (used by dropdowns elsewhere) — any authenticated user.
router.get('/', roleController.list);

router.get('/permissions/catalog', authorize('roles.view'), roleController.listAllPermissions);
router.post('/', authorize('roles.create'), roleValidator, validateRequest, roleController.create);
router.put('/:id', authorize('roles.edit'), roleValidator, validateRequest, roleController.update);
router.delete('/:id', authorize('roles.delete'), roleController.remove);
router.get('/:id/permissions', authorize('roles.view'), roleController.getPermissions);
router.put('/:id/permissions', authorize('roles.manage'), setPermissionsValidator, validateRequest, roleController.setPermissions);

export default router;
