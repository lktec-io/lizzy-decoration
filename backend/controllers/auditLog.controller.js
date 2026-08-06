import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';
import * as auditLogService from '../services/auditLog.service.js';
import * as userRepository from '../repositories/user.repository.js';
import { buildAuditLogPdf, buildAuditLogExcel, buildAuditLogCsv, buildAuditLogFilename } from '../services/auditLogExport.service.js';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await auditLogService.listAuditLogs(req.query, req.user);
  return success(res, { data: { items, meta } });
});

export const filterOptions = asyncHandler(async (req, res) => {
  const options = await auditLogService.getFilterOptions(req.user);
  return success(res, { data: options });
});

async function exportContext(req) {
  const generatedBy = await userRepository.findById(req.user.id);
  return {
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
    generatedByName: generatedBy ? `${generatedBy.first_name} ${generatedBy.last_name}` : undefined,
  };
}

export const exportPdf = asyncHandler(async (req, res) => {
  const rows = await auditLogService.getLogsForExport(req.query, req.user);
  const pdf = await buildAuditLogPdf(rows, await exportContext(req));
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${buildAuditLogFilename('pdf')}"`);
  res.send(pdf);
});

export const exportExcel = asyncHandler(async (req, res) => {
  const rows = await auditLogService.getLogsForExport(req.query, req.user);
  const workbook = await buildAuditLogExcel(rows, await exportContext(req));
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${buildAuditLogFilename('xlsx')}"`);
  await workbook.xlsx.write(res);
  res.end();
});

export const exportCsv = asyncHandler(async (req, res) => {
  const rows = await auditLogService.getLogsForExport(req.query, req.user);
  const csv = buildAuditLogCsv(rows, await exportContext(req));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${buildAuditLogFilename('csv')}"`);
  res.send(csv);
});
