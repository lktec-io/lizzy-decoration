import apiClient from './apiClient';

export async function getSystemSettings() {
  const { data } = await apiClient.get('/settings/system');
  return data.data;
}

export async function updateSystemSettings(payload) {
  const { data } = await apiClient.put('/settings/system', payload);
  return data.data;
}

export async function listExpenseCategories(params) {
  const { data } = await apiClient.get('/settings/expense-categories', { params });
  return data.data;
}

export async function createExpenseCategory(payload) {
  const { data } = await apiClient.post('/settings/expense-categories', payload);
  return data.data;
}

export async function updateExpenseCategory(id, payload) {
  const { data } = await apiClient.put(`/settings/expense-categories/${id}`, payload);
  return data.data;
}

export async function deleteExpenseCategory(id) {
  await apiClient.delete(`/settings/expense-categories/${id}`);
}

export async function listCarwashServices(params) {
  const { data } = await apiClient.get('/settings/carwash-services', { params });
  return data.data;
}

export async function createCarwashService(payload) {
  const { data } = await apiClient.post('/settings/carwash-services', payload);
  return data.data;
}

export async function updateCarwashService(id, payload) {
  const { data } = await apiClient.put(`/settings/carwash-services/${id}`, payload);
  return data.data;
}

export async function setCarwashServiceStatus(id, status) {
  const { data } = await apiClient.patch(`/settings/carwash-services/${id}/status`, { status });
  return data.data;
}
