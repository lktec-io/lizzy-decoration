import { Router } from 'express';
import * as expenseController from '../controllers/expense.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { expenseValidator } from '../validators/expense.validator.js';

const router = Router();

router.use(authenticate, authorize('expenses.view'));

router.get('/categories', expenseController.listCategories);
router.get('/', expenseController.list);
router.get('/:id', expenseController.getById);
router.post('/', authorize('expenses.create'), expenseValidator, validateRequest, expenseController.create);
router.put('/:id', authorize('expenses.edit'), expenseValidator, validateRequest, expenseController.update);
router.delete('/:id', authorize('expenses.delete'), expenseController.remove);

export default router;
