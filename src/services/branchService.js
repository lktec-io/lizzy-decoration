import apiClient from './apiClient';

// Lightweight lookup for dropdowns.
export async function listActiveBranches() {
  const { data } = await apiClient.get('/branches/active');
  return data.data;
}

export async function listBranches(params) {
  const { data } = await apiClient.get('/branches', { params });
  return data.data;
}

export async function getBranch(id) {
  const { data } = await apiClient.get(`/branches/${id}`);
  return data.data;
}

export async function createBranch(payload) {
  const { data } = await apiClient.post('/branches', payload);
  return data.data;
}

export async function updateBranch(id, payload) {
  const { data } = await apiClient.put(`/branches/${id}`, payload);
  return data.data;
}

export async function changeBranchStatus(id, status) {
  const { data } = await apiClient.patch(`/branches/${id}/status`, { status });
  return data.data;
}
