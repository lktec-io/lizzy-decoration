import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as permissionRepository from '../repositories/permission.repository.js';

const CACHE_TTL_MS = 60_000;
const cache = new Map(); // roleId -> { codes: Set, expiresAt: number }

async function getPermissionCodes(roleId) {
  const cached = cache.get(roleId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.codes;
  }

  const codes = new Set(await permissionRepository.getCodesForRole(roleId));
  cache.set(roleId, { codes, expiresAt: Date.now() + CACHE_TTL_MS });
  return codes;
}

// Invalidate on role/permission changes (called from role management once Phase 4 UI exists).
export function invalidatePermissionCache(roleId) {
  if (roleId) cache.delete(roleId);
  else cache.clear();
}

export function authorize(permissionCode) {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    const codes = await getPermissionCodes(req.user.roleId);
    if (!codes.has(permissionCode)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }

    return next();
  });
}
