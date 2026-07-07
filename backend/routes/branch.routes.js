import { Router } from 'express';
import * as branchController from '../controllers/branch.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

// Full branch CRUD (create/edit/deactivate/assign-manager) is Phase 5 scope.
router.get('/', authenticate, branchController.listActive);

export default router;
