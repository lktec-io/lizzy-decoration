import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import * as productionResetService from '../services/productionReset.service.js';

// Backend never trusts the frontend's "type RESET to enable the button"
// gate alone for a permanently destructive action — the exact same literal
// confirmation string must also be present in the request body, or this
// 400s before anything touches the database.
export const productionReset = asyncHandler(async (req, res) => {
  if (req.body.confirmation !== 'RESET') {
    throw new ApiError(400, 'Type RESET to confirm this action');
  }

  const summary = await productionResetService.performProductionReset(
    { includeActivityLogs: Boolean(req.body.includeActivityLogs) },
    req.user.id,
    req.user,
  );

  return success(res, { message: 'Production Reset completed successfully', data: summary });
});
