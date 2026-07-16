import { body } from 'express-validator';

const CUSTOMER_TYPES = ['walk_in', 'retail', 'wholesale', 'vip', 'business'];

export const customerValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 100 }),
  // Many walk-in customers only give one name ("Kulwa", "Frank") — last
  // name is genuinely optional, not a required field with a fallback. An
  // earlier version required this and the frontend worked around it by
  // duplicating firstName into lastName, which is what caused customers to
  // save (and display) as "Kulwa Kulwa".
  body('lastName').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('Last name must be 100 characters or fewer'),
  body('businessName').optional({ values: 'falsy' }).isLength({ max: 150 }),
  body('phone').trim().notEmpty().withMessage('Phone number is required').isLength({ max: 20 }),
  body('altPhone').optional({ values: 'falsy' }).isLength({ max: 20 }),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Enter a valid email address'),
  body('address').optional({ values: 'falsy' }).isLength({ max: 255 }),
  body('region').optional({ values: 'falsy' }).isLength({ max: 100 }),
  body('district').optional({ values: 'falsy' }).isLength({ max: 100 }),
  body('tinNumber').optional({ values: 'falsy' }).isLength({ max: 50 }),
  body('customerType').optional({ values: 'falsy' }).isIn(CUSTOMER_TYPES).withMessage('Invalid customer type'),
  body('status').optional({ values: 'falsy' }).isIn(['active', 'inactive']),
  body('notes').optional({ values: 'falsy' }).isLength({ max: 1000 }).withMessage('Notes must be 1000 characters or fewer'),
];

export const changeStatusValidator = [
  body('status').isIn(['active', 'inactive']).withMessage('Invalid status'),
];
