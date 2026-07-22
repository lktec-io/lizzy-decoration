import { body } from 'express-validator';

export const checkoutValidator = [
  body('idempotencyKey').optional({ values: 'falsy' }).isLength({ max: 64 }),
  body('branchId').notEmpty().withMessage('Branch is required').isInt(),
  body('customerId').optional({ values: 'falsy' }).isInt(),
  body('notes').optional({ values: 'falsy' }).isLength({ max: 255 }),
  body('items').isArray({ min: 1 }).withMessage('Cart is empty'),
  body('items.*.productId').isInt().withMessage('Invalid product'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Invalid unit price'),
  body('items.*.discountAmount').optional({ values: 'falsy' }).isFloat({ min: 0 }),
  body('cartDiscountAmount').optional({ values: 'falsy' }).isFloat({ min: 0 }),
  body('payments').isArray({ min: 1 }).withMessage('Add at least one payment'),
  body('payments.*.method').isIn(['cash', 'mpesa', 'airtel_money', 'bank_transfer', 'card']).withMessage('Invalid payment method'),
  body('payments.*.amount').isFloat({ gt: 0 }).withMessage('Payment amount must be greater than zero'),
  body('payments.*.referenceNumber').optional({ values: 'falsy' }).isLength({ max: 100 }),
];
