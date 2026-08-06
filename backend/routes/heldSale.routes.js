import { Router } from 'express';
import * as heldSaleController from '../controllers/heldSale.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();

// Gated by sales.create (not sales.view) for the WHOLE router — Store
// Keeper has sales.view only (seeders/004_fix_role_permissions.sql), so
// this single gate is enough to keep Store Keeper out of every Held Sales
// endpoint, matching the spec's "Store Keeper must NOT access POS held
// sales" (not just "can't create one"). Cashier/Manager/Super Administrator
// all hold sales.create already — no new permission needed.
router.use(authenticate, authorize('sales.create'));

router.get('/', heldSaleController.list);
router.get('/:id', heldSaleController.getById);
router.post('/', heldSaleController.hold);
router.delete('/:id', heldSaleController.remove);

export default router;
