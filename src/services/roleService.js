import apiClient from './apiClient';

// Full CRUD + permission matrix service lands in Phase 4. For now this only
// lists roles for dropdowns (Users form, etc.).
export async function listRoles() {
  const { data } = await apiClient.get('/roles');
  return data.data;
}
