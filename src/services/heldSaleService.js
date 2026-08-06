import apiClient from './apiClient';

export async function listHeldSales(branchId) {
  const { data } = await apiClient.get('/held-sales', { params: { branchId } });
  return data.data;
}

export async function getHeldSale(id) {
  const { data } = await apiClient.get(`/held-sales/${id}`);
  return data.data;
}

export async function holdSale(payload) {
  const { data } = await apiClient.post('/held-sales', payload);
  return data.data;
}

export async function deleteHeldSale(id) {
  await apiClient.delete(`/held-sales/${id}`);
}
