import { body } from 'express-validator';

export const expenseValidator = [
  body('expenseCategoryId').notEmpty().withMessage('Expense category is required').isInt(),
  body('branchId').notEmpty().withMessage('Branch is required').isInt(),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than zero'),
  body('description').optional({ values: 'falsy' }).isLength({ max: 255 }),
  body('expenseDate').notEmpty().withMessage('Expense date is required').isISO8601().withMessage('Invalid date'),
];
