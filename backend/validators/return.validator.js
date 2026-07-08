import { body } from 'express-validator';

const REASONS = ['damaged', 'wrong_item', 'changed_mind', 'expired', 'other'];
const REFUND_METHODS = ['cash', 'mpesa', 'airtel_money', 'bank_transfer'];

export const createReturnValidator = [
  body('saleId').notEmpty().withMessage('Original sale is required').isInt(),
  body('reason').isIn(REASONS).withMessage('Invalid return reason'),
  body('refundMethod').isIn(REFUND_METHODS).withMessage('Invalid refund method'),
  body('customerId').optional({ values: 'falsy' }).isInt(),
  body('items').isArray({ min: 1 }).withMessage('Select at least one item to return'),
  body('items.*.saleItemId').isInt().withMessage('Invalid sale item'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];
