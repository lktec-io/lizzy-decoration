import { Router } from 'express';
import { success } from '../utils/apiResponse.js';

const router = Router();

// Module routers (auth, users, products, ...) are mounted here as each
// phase is implemented — see docs/API_PLAN.md for the full contract.

router.get('/health', (req, res) => {
  return success(res, { message: 'JOZZY ERP API is running' });
});

export default router;
