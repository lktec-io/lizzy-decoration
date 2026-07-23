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

// The barcode scanner's only lookup — exact match on products.code (the
// one field that serves as this app's barcode), not the fuzzy `search`
// listSellableProducts() does for the product grid. Resolves to null, not
// an error, when nothing matches — that's an ordinary scan outcome.
export async function lookupSellableProduct(params) {
  const { data } = await apiClient.get('/products/lookup', { params });
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
  const { data } = await apiClient.delete(`/products/${id}`);
  return data.data;
}

export async function listArchivedProducts(params) {
  const { data } = await apiClient.get('/products/archived', { params });
  return data.data;
}

export async function restoreProduct(id) {
  const { data } = await apiClient.post(`/products/${id}/restore`);
  return data.data;
}

export async function permanentlyDeleteProduct(id) {
  await apiClient.delete(`/products/${id}/permanent`);
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
