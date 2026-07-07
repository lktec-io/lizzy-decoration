import apiClient from './apiClient';

export async function getProductQr(productId) {
  const { data } = await apiClient.get(`/products/${productId}/qr`);
  return data.data;
}

export async function regenerateProductQr(productId) {
  const { data } = await apiClient.post(`/products/${productId}/qr/regenerate`);
  return data.data;
}
