import { verifyAccessToken } from '../utils/tokenUtils.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../config/logger.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Authentication required');
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, roleId: payload.roleId, role: payload.role, branchId: payload.branchId };
    return next();
  } catch (err) {
    // The client only ever sees the generic message below; the specific
    // jsonwebtoken reason (TokenExpiredError vs JsonWebTokenError vs a
    // wrong-secret signature mismatch) is logged here so intermittent
    // auth failures are diagnosable from server logs instead of a guess.
    logger.warn('Access token verification failed', {
      reason: err.name,
      message: err.message,
      path: req.originalUrl,
    });
    throw new ApiError(401, 'Invalid or expired access token');
  }
});
