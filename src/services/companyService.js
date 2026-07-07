import apiClient from './apiClient';

export async function getCompany() {
  const { data } = await apiClient.get('/company');
  return data.data;
}

export async function updateCompany(payload) {
  const { data } = await apiClient.put('/company', payload);
  return data.data;
}

export async function uploadLogo(file) {
  const formData = new FormData();
  formData.append('logo', file);
  const { data } = await apiClient.post('/company/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}
