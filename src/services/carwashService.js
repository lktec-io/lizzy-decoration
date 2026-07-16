import apiClient from './apiClient';

export async function listCarwashServices() {
  const { data } = await apiClient.get('/carwash/services');
  return data.data;
}

export async function listCarwashTransactions(params) {
  const { data } = await apiClient.get('/carwash', { params });
  return data.data;
}

export async function recordCarwashTransaction(payload) {
  const { data } = await apiClient.post('/carwash', payload);
  return data.data;
}

export async function updateCarwashTransaction(id, payload) {
  const { data } = await apiClient.put(`/carwash/${id}`, payload);
  return data.data;
}

export async function deleteCarwashTransaction(id) {
  await apiClient.delete(`/carwash/${id}`);
}
