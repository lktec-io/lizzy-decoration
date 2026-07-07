import { body } from 'express-validator';
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from '../utils/passwordPolicy.js';

export const loginValidator = [
  body('identifier').trim().notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('rememberMe').optional().isBoolean().withMessage('rememberMe must be a boolean'),
];

export const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
];

export const resetPasswordValidator = [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .custom((value) => isStrongPassword(value))
    .withMessage(PASSWORD_POLICY_MESSAGE),
];
