import { ApiError } from '../utils/apiError.js';
import { failure } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';

export function notFoundHandler(req, res) {
  return failure(res, { message: `Route not found: ${req.method} ${req.originalUrl}`, status: 404 });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  logger.error(err.message, { stack: err.stack, path: req.originalUrl, method: req.method });

  if (err instanceof ApiError) {
    return failure(res, { message: err.message, errors: err.errors, status: err.status });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return failure(res, { message: 'A record with these details already exists', status: 409 });
  }

  // Never leak stack traces or raw SQL/driver errors to the client.
  return failure(res, { message: 'Internal server error', status: 500 });
}
