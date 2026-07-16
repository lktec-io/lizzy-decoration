import { body } from 'express-validator';

export const recordTransactionValidator = [
  body('plateNumber').trim().notEmpty().withMessage('Plate number is required').isLength({ max: 20 }),
  body('customerName').trim().notEmpty().withMessage('Customer name is required').isLength({ max: 150 }),
  body('phone').trim().notEmpty().withMessage('Phone number is required').isLength({ max: 20 }),
  body('serviceId').notEmpty().withMessage('Service is required').isInt(),
  body('branchId').notEmpty().withMessage('Branch is required').isInt(),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than zero'),
  body('paymentMethod').isIn(['cash', 'mpesa', 'airtel_money']).withMessage('Invalid payment method'),
];

// Same shape as recordTransactionValidator — edit reuses the exact fields
// a create does, just against an existing transaction id.
export const updateTransactionValidator = recordTransactionValidator;

export const manageCarwashServiceValidator = [
  body('name').trim().notEmpty().withMessage('Package name is required').isLength({ max: 100 }),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
  body('status').optional({ values: 'falsy' }).isIn(['active', 'inactive']),
];
