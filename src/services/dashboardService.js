import apiClient from './apiClient';

export async function getKpis() {
  const { data } = await apiClient.get('/dashboard/kpis');
  return data.data;
}

export async function getChart(type) {
  const { data } = await apiClient.get(`/dashboard/charts/${type}`);
  return data.data;
}

export async function getActivity(limit = 20) {
  const { data } = await apiClient.get('/dashboard/activity', { params: { limit } });
  return data.data;
}
