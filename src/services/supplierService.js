import apiClient from './apiClient';

export async function listActiveSuppliers() {
  const { data } = await apiClient.get('/suppliers/active');
  return data.data;
}

export async function listSuppliers(params) {
  const { data } = await apiClient.get('/suppliers', { params });
  return data.data;
}

export async function getSupplier(id) {
  const { data } = await apiClient.get(`/suppliers/${id}`);
  return data.data;
}

export async function getSupplierPurchaseHistory(id, params) {
  const { data } = await apiClient.get(`/suppliers/${id}/purchases`, { params });
  return data.data;
}

export async function createSupplier(payload) {
  const { data } = await apiClient.post('/suppliers', payload);
  return data.data;
}

export async function updateSupplier(id, payload) {
  const { data } = await apiClient.put(`/suppliers/${id}`, payload);
  return data.data;
}

export async function changeSupplierStatus(id, status) {
  const { data } = await apiClient.patch(`/suppliers/${id}/status`, { status });
  return data.data;
}

export async function deleteSupplier(id) {
  await apiClient.delete(`/suppliers/${id}`);
}
