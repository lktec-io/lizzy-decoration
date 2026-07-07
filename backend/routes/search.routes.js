import { Router } from 'express';
import * as searchController from '../controllers/search.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

router.get('/', authenticate, searchController.search);

export default router;
