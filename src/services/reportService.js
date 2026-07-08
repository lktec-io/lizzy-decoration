import apiClient from './apiClient';

export async function getReport(type, params) {
  const { data } = await apiClient.get(`/reports/${type}`, { params });
  return data.data;
}
