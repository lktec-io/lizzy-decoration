import apiClient from './apiClient';

export async function listUsers(params) {
  const { data } = await apiClient.get('/users', { params });
  return data.data;
}

export async function getUser(id) {
  const { data } = await apiClient.get(`/users/${id}`);
  return data.data;
}

export async function createUser(payload) {
  const { data } = await apiClient.post('/users', payload);
  return data.data;
}

export async function updateUser(id, payload) {
  const { data } = await apiClient.put(`/users/${id}`, payload);
  return data.data;
}

export async function changeUserStatus(id, status) {
  const { data } = await apiClient.patch(`/users/${id}/status`, { status });
  return data.data;
}

export async function resetUserPassword(id, newPassword) {
  const { data } = await apiClient.patch(`/users/${id}/password`, { newPassword });
  return data.message;
}

export async function deleteUser(id) {
  await apiClient.delete(`/users/${id}`);
}

export async function uploadUserAvatar(id, file) {
  const formData = new FormData();
  formData.append('avatar', file);
  const { data } = await apiClient.post(`/users/${id}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}
