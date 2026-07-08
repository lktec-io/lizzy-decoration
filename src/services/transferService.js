import apiClient from './apiClient';

export async function listTransfers(params) {
  const { data } = await apiClient.get('/transfers', { params });
  return data.data;
}

export async function getTransfer(id) {
  const { data } = await apiClient.get(`/transfers/${id}`);
  return data.data;
}

export async function createTransfer(payload) {
  const { data } = await apiClient.post('/transfers', payload);
  return data.data;
}

export async function approveTransfer(id) {
  const { data } = await apiClient.post(`/transfers/${id}/approve`);
  return data.data;
}

export async function rejectTransfer(id) {
  const { data } = await apiClient.post(`/transfers/${id}/reject`);
  return data.data;
}
