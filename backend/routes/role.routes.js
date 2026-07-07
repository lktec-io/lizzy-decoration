import { Router } from 'express';
import * as roleController from '../controllers/role.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

// Full role CRUD + permission matrix management is Phase 4 scope.
router.get('/', authenticate, roleController.list);

export default router;
