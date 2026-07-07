import { body } from 'express-validator';

export const brandValidator = [
  body('name').trim().notEmpty().withMessage('Brand name is required').isLength({ max: 100 }),
  body('code').trim().notEmpty().withMessage('Brand code is required').isLength({ max: 20 }),
  body('description').optional({ values: 'falsy' }).isLength({ max: 255 }),
  body('country').optional({ values: 'falsy' }).isLength({ max: 100 }),
  body('status').optional({ values: 'falsy' }).isIn(['active', 'inactive']),
];
