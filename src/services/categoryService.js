import apiClient from './apiClient';

export async function listActiveCategories() {
  const { data } = await apiClient.get('/categories/active');
  return data.data;
}

export async function listCategories(params) {
  const { data } = await apiClient.get('/categories', { params });
  return data.data;
}

export async function createCategory(payload) {
  const { data } = await apiClient.post('/categories', payload);
  return data.data;
}

export async function updateCategory(id, payload) {
  const { data } = await apiClient.put(`/categories/${id}`, payload);
  return data.data;
}

export async function deleteCategory(id) {
  await apiClient.delete(`/categories/${id}`);
}
