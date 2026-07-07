import { validationResult } from 'express-validator';
import { failure } from '../utils/apiResponse.js';

export function validateRequest(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((err) => ({ field: err.path, message: err.msg }));
  return failure(res, { message: 'Validation failed', errors, status: 400 });
}
