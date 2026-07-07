import { body } from 'express-validator';

export const categoryValidator = [
  body('name').trim().notEmpty().withMessage('Category name is required').isLength({ max: 100 }),
  body('code').trim().notEmpty().withMessage('Category code is required').isLength({ max: 20 }),
  body('description').optional({ values: 'falsy' }).isLength({ max: 255 }),
  body('status').optional({ values: 'falsy' }).isIn(['active', 'inactive']),
];
