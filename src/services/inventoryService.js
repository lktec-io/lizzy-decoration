import apiClient from './apiClient';

export async function listInventory(params) {
  const { data } = await apiClient.get('/inventory', { params });
  return data.data;
}

export async function getInventorySummary() {
  const { data } = await apiClient.get('/inventory/summary');
  return data.data;
}

export async function listMovements(params) {
  const { data } = await apiClient.get('/inventory/movements', { params });
  return data.data;
}

export async function createAdjustment(payload) {
  const { data } = await apiClient.post('/inventory/adjustments', payload);
  return data.data;
}
