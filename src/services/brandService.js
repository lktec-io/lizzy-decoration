import apiClient from './apiClient';

export async function listActiveBrands() {
  const { data } = await apiClient.get('/brands/active');
  return data.data;
}

export async function listBrands(params) {
  const { data } = await apiClient.get('/brands', { params });
  return data.data;
}

export async function createBrand(payload) {
  const { data } = await apiClient.post('/brands', payload);
  return data.data;
}

export async function updateBrand(id, payload) {
  const { data } = await apiClient.put(`/brands/${id}`, payload);
  return data.data;
}

export async function deleteBrand(id) {
  await apiClient.delete(`/brands/${id}`);
}
