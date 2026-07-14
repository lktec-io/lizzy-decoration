import { body } from 'express-validator';
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from '../utils/passwordPolicy.js';

const baseFields = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 100 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 100 }),
  body('gender').optional({ values: 'falsy' }).isIn(['male', 'female', 'other']),
  body('phone').trim().notEmpty().withMessage('Phone number is required').isLength({ max: 20 }),
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('username').trim().notEmpty().withMessage('Username is required').isLength({ min: 3, max: 50 }),
  body('roleId').notEmpty().withMessage('Role is required').isInt().withMessage('Role must be valid'),
  body('branchId').optional({ values: 'falsy' }).isInt(),
  body('branchIds').optional().isArray().withMessage('branchIds must be an array'),
];

export const createUserValidator = [
  ...baseFields,
  body('password')
    .custom((value) => isStrongPassword(value))
    .withMessage(PASSWORD_POLICY_MESSAGE),
  body('status').optional({ values: 'falsy' }).isIn(['active', 'suspended', 'locked']).withMessage('Invalid status'),
];

export const updateUserValidator = [...baseFields];

export const changeStatusValidator = [
  body('status').isIn(['active', 'suspended', 'locked']).withMessage('Invalid status'),
];

export const resetPasswordValidator = [
  body('newPassword')
    .custom((value) => isStrongPassword(value))
    .withMessage(PASSWORD_POLICY_MESSAGE),
];
