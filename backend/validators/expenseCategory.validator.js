import { body } from 'express-validator';

export const expenseCategoryValidator = [
  body('name').trim().notEmpty().withMessage('Category name is required').isLength({ max: 100 }),
];
