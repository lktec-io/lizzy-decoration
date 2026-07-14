import apiClient from './apiClient';

export async function listRoles() {
  const { data } = await apiClient.get('/roles');
  return data.data;
}

export async function createRole(payload) {
  const { data } = await apiClient.post('/roles', payload);
  return data.data;
}

export async function updateRole(id, payload) {
  const { data } = await apiClient.put(`/roles/${id}`, payload);
  return data.data;
}

export async function deleteRole(id) {
  await apiClient.delete(`/roles/${id}`);
}
