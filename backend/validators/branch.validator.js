import { body } from 'express-validator';

export const branchValidator = [
  body('name').trim().notEmpty().withMessage('Branch name is required').isLength({ max: 100 }),
  body('code').trim().notEmpty().withMessage('Branch code is required').isLength({ max: 20 }),
  body('managerId').optional({ values: 'falsy' }).isInt(),
  body('phone').optional({ values: 'falsy' }).isLength({ max: 20 }),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Enter a valid email address'),
  body('openingDate').optional({ values: 'falsy' }).isISO8601().withMessage('Enter a valid date'),
];

export const changeStatusValidator = [
  body('status').isIn(['active', 'inactive']).withMessage('Invalid status'),
];
