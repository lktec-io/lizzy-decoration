import { body } from 'express-validator';

export const bulkLabelValidator = [
  body('productIds').isArray({ min: 1 }).withMessage('Select at least one product'),
  body('productIds.*').isInt(),
  body('size').optional({ values: 'falsy' }).isIn(['small', 'medium', 'large']),
  body('branchId').optional({ values: 'falsy' }).isInt(),
];
