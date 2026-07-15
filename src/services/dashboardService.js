import apiClient from './apiClient';

export async function getKpis() {
  const { data } = await apiClient.get('/dashboard/kpis');
  return data.data;
}

export async function getChart(type, params) {
  const { data } = await apiClient.get(`/dashboard/charts/${type}`, { params });
  return data.data;
}

export async function getActivity(limit) {
  const { data } = await apiClient.get('/dashboard/activity', { params: { limit } });
  return data.data;
}

export async function getSystemStatus() {
  const { data } = await apiClient.get('/dashboard/system-status');
  return data.data;
}
