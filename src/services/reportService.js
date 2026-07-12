import apiClient from './apiClient';

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
