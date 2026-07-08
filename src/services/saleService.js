import apiClient from './apiClient';

function openPdfBlob(blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export async function listSales(params) {
  const { data } = await apiClient.get('/sales', { params });
  return data.data;
}

export async function getSale(id) {
  const { data } = await apiClient.get(`/sales/${id}`);
  return data.data;
}

export async function checkout(payload) {
  const { data } = await apiClient.post('/sales', payload);
  return data.data;
}

// Preview/Print/Download/Reprint all render the same PDF — opened in a new
// tab, where the browser's own print dialog and "Save as PDF" cover the
// remaining spec features without needing separate endpoints.
export async function openReceipt(id) {
  const { data } = await apiClient.get(`/sales/${id}/receipt`, { responseType: 'blob' });
  openPdfBlob(data);
}
