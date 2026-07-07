import { Router } from 'express';
import { success } from '../utils/apiResponse.js';
import authRoutes from './auth.routes.js';
import companyRoutes from './company.routes.js';

const router = Router();

// Module routers (auth, users, products, ...) are mounted here as each
// phase is implemented — see docs/API_PLAN.md for the full contract.

router.get('/health', (req, res) => {
  return success(res, { message: 'JOZZY ERP API is running' });
});

router.use('/auth', authRoutes);
router.use('/company', companyRoutes);

export default router;
