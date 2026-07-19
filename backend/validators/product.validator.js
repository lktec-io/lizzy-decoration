import { body } from 'express-validator';

export const productValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required').isLength({ max: 150 }),
  body('categoryId').notEmpty().withMessage('Category is required').isInt(),
  body('brandId').optional({ values: 'falsy' }).isInt(),
  body('description').optional({ values: 'falsy' }).isLength({ max: 2000 }),
  body('buyingPrice').isFloat({ min: 0 }).withMessage('Buying price must be a positive number'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  body('minStock').optional({ values: 'falsy' }).isInt({ min: 0 }),
  body('status').optional({ values: 'falsy' }).isIn(['active', 'inactive']),
];

export const bulkStatusValidator = [
  body('ids').isArray({ min: 1 }).withMessage('Select at least one product'),
  body('ids.*').isInt(),
  body('status').isIn(['active', 'inactive']).withMessage('Invalid status'),
];
