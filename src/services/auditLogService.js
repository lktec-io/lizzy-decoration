import apiClient from './apiClient';
import { downloadBlob } from '../utils/exportCsv';

export async function listAuditLogs(params) {
  const { data } = await apiClient.get('/audit-logs', { params });
  return data.data;
}

export async function getAuditLogFilterOptions() {
  const { data } = await apiClient.get('/audit-logs/filter-options');
  return data.data;
}

function buildFilename(extension) {
  const datePart = new Date().toISOString().slice(0, 10);
  return `Audit_Trail_${datePart}.${extension}`;
}

export async function exportAuditLogPdf(params) {
  const { data } = await apiClient.get('/audit-logs/export/pdf', { params, responseType: 'blob' });
  downloadBlob(buildFilename('pdf'), data);
}

export async function exportAuditLogExcel(params) {
  const { data } = await apiClient.get('/audit-logs/export/excel', { params, responseType: 'blob' });
  downloadBlob(buildFilename('xlsx'), data);
}

export async function exportAuditLogCsv(params) {
  const { data } = await apiClient.get('/audit-logs/export/csv', { params, responseType: 'blob' });
  downloadBlob(buildFilename('csv'), data);
}
