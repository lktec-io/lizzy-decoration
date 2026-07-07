import apiClient from './apiClient';

export async function listPurchases(params) {
  const { data } = await apiClient.get('/purchases', { params });
  return data.data;
}

export async function getPurchase(id) {
  const { data } = await apiClient.get(`/purchases/${id}`);
  return data.data;
}

export async function createPurchase(payload) {
  const { data } = await apiClient.post('/purchases', payload);
  return data.data;
}

export async function addSupplierPayment(payload) {
  await apiClient.post('/purchases/payments', payload);
}
