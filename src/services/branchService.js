import apiClient from './apiClient';

// Full CRUD service lands in Phase 5. For now this only lists active
// branches for dropdowns (Users form, etc.).
export async function listActiveBranches() {
  const { data } = await apiClient.get('/branches');
  return data.data;
}
