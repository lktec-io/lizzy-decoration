import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';
import * as roleRepository from '../repositories/role.repository.js';

// Minimal read-only lookup for now (dropdowns). Full CRUD + permission
// matrix management is Phase 4.
export const list = asyncHandler(async (req, res) => {
  const roles = await roleRepository.findAll();
  return success(res, { data: roles });
});
