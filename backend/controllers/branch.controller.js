import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';
import * as branchRepository from '../repositories/branch.repository.js';

// Minimal read-only lookup for now (dropdowns). Full CRUD is Phase 5.
export const listActive = asyncHandler(async (req, res) => {
  const branches = await branchRepository.findAllActive();
  return success(res, { data: branches });
});
