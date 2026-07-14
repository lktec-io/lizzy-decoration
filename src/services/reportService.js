import apiClient from './apiClient';
import { downloadBlob } from '../utils/exportCsv';

export async function getReport(type, params) {
  const { data } = await apiClient.get(`/reports/${type}`, { params });
  return data.data;
}

export async function exportReportPdf(type, params) {
  const { data } = await apiClient.get(`/reports/${type}/export/pdf`, { params, responseType: 'blob' });
  const url = URL.createObjectURL(data);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export async function exportReportExcel(type, params) {
  const { data } = await apiClient.get(`/reports/${type}/export/excel`, { params, responseType: 'blob' });
  downloadBlob(`${type}-report.xlsx`, data);
}

export async function exportReportCsv(type, params) {
  const { data } = await apiClient.get(`/reports/${type}/export/csv`, { params, responseType: 'blob' });
  downloadBlob(`${type}-report.csv`, data);
}
