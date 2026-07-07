import { verifyAccessToken } from '../utils/tokenUtils.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

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
  } catch {
    throw new ApiError(401, 'Invalid or expired access token');
  }
});
