import { body } from 'express-validator';

export const upsertCompanyValidator = [
  body('companyName').trim().notEmpty().withMessage('Company name is required').isLength({ max: 150 }),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Enter a valid email address'),
  body('website').optional({ values: 'falsy' }).isURL().withMessage('Enter a valid website URL'),
  body('phone').optional({ values: 'falsy' }).isLength({ max: 20 }),
  body('currency').optional({ values: 'falsy' }).isLength({ max: 10 }),
  body('status').optional({ values: 'falsy' }).isIn(['active', 'inactive']),
];
