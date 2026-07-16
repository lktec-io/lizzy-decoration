import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';
import * as reportService from '../services/report.service.js';
import { buildReportPdf } from '../services/reportPdf.service.js';
import { buildReportExcel } from '../services/reportExcel.service.js';
import { buildReportCsv } from '../services/reportCsv.service.js';
import { buildReportFilename } from '../services/reportConfig.js';
import * as companyRepository from '../repositories/company.repository.js';
import * as userRepository from '../repositories/user.repository.js';
import * as branchRepository from '../repositories/branch.repository.js';
import * as categoryRepository from '../repositories/category.repository.js';
import * as customerRepository from '../repositories/customer.repository.js';
import * as productRepository from '../repositories/product.repository.js';

export const getReport = asyncHandler(async (req, res) => {
  const report = await reportService.getReport(req.params.type, req.query, req.user);
  return success(res, { data: report });
});

// Resolves the human-readable names behind whatever filter query params are
// present (raw IDs would be meaningless on a printed report) — only looks up
// the ones the Reports UI actually exposes as filter inputs.
async function buildFiltersLabel(query) {
  const parts = [];
  if (query.branchId) {
    const branch = await branchRepository.findById(Number(query.branchId));
    if (branch) parts.push(`Branch: ${branch.name}`);
  }
  if (query.categoryId) {
    const category = await categoryRepository.findById(Number(query.categoryId));
    if (category) parts.push(`Category: ${category.name}`);
  }
  if (query.customerId) {
    const customer = await customerRepository.findById(Number(query.customerId));
    if (customer) parts.push(`Customer: ${customer.first_name} ${customer.last_name}`);
  }
  if (query.productId) {
    const product = await productRepository.findById(Number(query.productId));
    if (product) parts.push(`Product: ${product.name}`);
  }
  if (query.status) {
    parts.push(`Status: ${query.status.charAt(0).toUpperCase()}${query.status.slice(1)}`);
  }
  return parts.join(' · ');
}

async function buildExportContext(req) {
  const [company, generatedBy, filtersLabel] = await Promise.all([
    companyRepository.get(),
    userRepository.findById(req.user.id),
    buildFiltersLabel(req.query),
  ]);
  return {
    company,
    generatedByName: generatedBy ? `${generatedBy.first_name} ${generatedBy.last_name}` : undefined,
    filtersLabel,
  };
}

export const exportPdf = asyncHandler(async (req, res) => {
  const report = await reportService.getReport(req.params.type, req.query, req.user);
  const context = await buildExportContext(req);
  const pdf = await buildReportPdf(req.params.type, report, { ...req.query, ...context });
  const filename = buildReportFilename(req.params.type, report, 'pdf');
  res.setHeader('Content-Type', 'application/pdf');
  // Was "inline" — the browser opened the PDF in a new tab instead of
  // downloading it. "attachment" is what actually triggers a direct
  // download, matching how Excel/CSV already behaved.
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdf);
});

export const exportExcel = asyncHandler(async (req, res) => {
  const report = await reportService.getReport(req.params.type, req.query, req.user);
  const context = await buildExportContext(req);
  const workbook = await buildReportExcel(req.params.type, report, { ...req.query, ...context });
  const filename = buildReportFilename(req.params.type, report, 'xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
});

export const exportCsv = asyncHandler(async (req, res) => {
  const report = await reportService.getReport(req.params.type, req.query, req.user);
  const csv = buildReportCsv(req.params.type, report);
  const filename = buildReportFilename(req.params.type, report, 'csv');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});
