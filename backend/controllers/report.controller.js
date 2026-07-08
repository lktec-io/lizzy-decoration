import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';
import * as reportService from '../services/report.service.js';

export const getReport = asyncHandler(async (req, res) => {
  const report = await reportService.getReport(req.params.type, req.query, req.user);
  return success(res, { data: report });
});
