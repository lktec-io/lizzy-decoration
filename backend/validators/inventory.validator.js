import { body } from 'express-validator';

export const adjustmentValidator = [
  body('productId').notEmpty().withMessage('Product is required').isInt(),
  body('branchId').notEmpty().withMessage('Branch is required').isInt(),
  body('quantityChange')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: -100000, max: 100000 }).withMessage('Quantity must be a whole number')
    .custom((value) => Number(value) !== 0).withMessage('Quantity change cannot be zero'),
  body('reason').isIn(['damaged', 'expired', 'lost', 'correction', 'initial_count', 'system_error']).withMessage('Invalid reason'),
  body('description').optional({ values: 'falsy' }).isLength({ max: 500 }),
];
