import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';
import * as reportService from '../services/report.service.js';
import { buildReportPdf } from '../services/reportPdf.service.js';

export const getReport = asyncHandler(async (req, res) => {
  const report = await reportService.getReport(req.params.type, req.query, req.user);
  return success(res, { data: report });
});

export const exportPdf = asyncHandler(async (req, res) => {
  const report = await reportService.getReport(req.params.type, req.query, req.user);
  const pdf = await buildReportPdf(req.params.type, report, req.query);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${req.params.type}-report.pdf"`);
  res.send(pdf);
});
