import apiClient from './apiClient';

export async function globalSearch(query) {
  const { data } = await apiClient.get('/search', { params: { q: query } });
  return data.data;
}
