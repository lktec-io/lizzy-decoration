import { body } from 'express-validator';

export const createTransferValidator = [
  body('sourceBranchId').notEmpty().withMessage('Source branch is required').isInt(),
  body('destinationBranchId').notEmpty().withMessage('Destination branch is required').isInt(),
  body('items').isArray({ min: 1 }).withMessage('Add at least one product'),
  body('items.*.productId').isInt().withMessage('Invalid product'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];
