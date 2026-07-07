import { body } from 'express-validator';

export const createPurchaseValidator = [
  body('supplierId').notEmpty().withMessage('Supplier is required').isInt(),
  body('branchId').notEmpty().withMessage('Branch is required').isInt(),
  body('items').isArray({ min: 1 }).withMessage('Add at least one product'),
  body('items.*.productId').isInt().withMessage('Invalid product'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.buyingPrice').isFloat({ min: 0 }).withMessage('Buying price must be positive'),
];

export const paymentValidator = [
  body('supplierId').notEmpty().withMessage('Supplier is required').isInt(),
  body('purchaseOrderId').optional({ values: 'falsy' }).isInt(),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than zero'),
  body('paymentMethod').isIn(['cash', 'mpesa', 'airtel_money', 'bank_transfer']).withMessage('Invalid payment method'),
];
