import { body } from 'express-validator';

export const supplierValidator = [
  body('name').trim().notEmpty().withMessage('Supplier name is required').isLength({ max: 150 }),
  body('phone').optional({ values: 'falsy' }).isLength({ max: 20 }),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Enter a valid email address'),
  body('address').optional({ values: 'falsy' }).isLength({ max: 255 }),
  body('tinNumber').optional({ values: 'falsy' }).isLength({ max: 50 }),
  body('status').optional({ values: 'falsy' }).isIn(['active', 'inactive']),
];

export const changeStatusValidator = [
  body('status').isIn(['active', 'inactive']).withMessage('Invalid status'),
];
