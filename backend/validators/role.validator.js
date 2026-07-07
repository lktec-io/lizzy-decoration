import { body } from 'express-validator';

export const roleValidator = [
  body('name').trim().notEmpty().withMessage('Role name is required').isLength({ max: 50 }),
  body('description').optional({ values: 'falsy' }).isLength({ max: 255 }),
];

export const setPermissionsValidator = [
  body('permissionIds').isArray().withMessage('permissionIds must be an array'),
  body('permissionIds.*').isInt().withMessage('permissionIds must contain valid IDs'),
];
