import apiClient from './apiClient';

export async function runProductionReset({ confirmation, includeActivityLogs }) {
  const { data } = await apiClient.post('/system-maintenance/production-reset', { confirmation, includeActivityLogs });
  return data.data;
}
