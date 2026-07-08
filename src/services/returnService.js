import apiClient from './apiClient';

export async function listReturns(params) {
  const { data } = await apiClient.get('/returns', { params });
  return data.data;
}

export async function getReturn(id) {
  const { data } = await apiClient.get(`/returns/${id}`);
  return data.data;
}

export async function createReturn(payload) {
  const { data } = await apiClient.post('/returns', payload);
  return data.data;
}

export async function approveReturn(id) {
  const { data } = await apiClient.post(`/returns/${id}/approve`);
  return data.data;
}

export async function rejectReturn(id) {
  const { data } = await apiClient.post(`/returns/${id}/reject`);
  return data.data;
}
