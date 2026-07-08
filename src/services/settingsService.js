import apiClient from './apiClient';

export async function getSystemSettings() {
  const { data } = await apiClient.get('/settings/system');
  return data.data;
}

export async function updateSystemSettings(payload) {
  const { data } = await apiClient.put('/settings/system', payload);
  return data.data;
}

export async function listBackups(params) {
  const { data } = await apiClient.get('/settings/backups', { params });
  return data.data;
}

export async function createBackup() {
  const { data } = await apiClient.post('/settings/backups');
  return data.data;
}

export async function downloadBackup(id) {
  const { data } = await apiClient.get(`/settings/backups/${id}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backup-${id}.sql`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
