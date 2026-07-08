import apiClient from './apiClient';

export async function listProducts(params) {
  const { data } = await apiClient.get('/products', { params });
  return data.data;
}

export async function getProduct(id) {
  const { data } = await apiClient.get(`/products/${id}`);
  return data.data;
}

// Backs the POS product grid — active products with live stock at one branch.
export async function listSellableProducts(params) {
  const { data } = await apiClient.get('/products/sellable', { params });
  return data.data;
}

export async function createProduct(payload) {
  const { data } = await apiClient.post('/products', payload);
  return data.data;
}

export async function updateProduct(id, payload) {
  const { data } = await apiClient.put(`/products/${id}`, payload);
  return data.data;
}

export async function bulkUpdateStatus(ids, status) {
  await apiClient.patch('/products/bulk-status', { ids, status });
}

export async function deleteProduct(id) {
  await apiClient.delete(`/products/${id}`);
}

export async function uploadProductImage(id, file, isPrimary = false) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('isPrimary', String(isPrimary));
  const { data } = await apiClient.post(`/products/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function removeProductImage(id, imageId) {
  const { data } = await apiClient.delete(`/products/${id}/images/${imageId}`);
  return data.data;
}
