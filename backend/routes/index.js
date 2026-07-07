import { Router } from 'express';
import { success } from '../utils/apiResponse.js';
import authRoutes from './auth.routes.js';
import companyRoutes from './company.routes.js';
import userRoutes from './user.routes.js';
import branchRoutes from './branch.routes.js';
import roleRoutes from './role.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import searchRoutes from './search.routes.js';
import categoryRoutes from './category.routes.js';
import brandRoutes from './brand.routes.js';
import productRoutes from './product.routes.js';

const router = Router();

// Module routers (auth, users, products, ...) are mounted here as each
// phase is implemented — see docs/API_PLAN.md for the full contract.

router.get('/health', (req, res) => {
  return success(res, { message: 'JOZZY ERP API is running' });
});

router.use('/auth', authRoutes);
router.use('/company', companyRoutes);
router.use('/users', userRoutes);
router.use('/branches', branchRoutes);
router.use('/roles', roleRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/search', searchRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/products', productRoutes);

export default router;
