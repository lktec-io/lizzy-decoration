import apiClient from './apiClient';

export async function listExpenseCategories() {
  const { data } = await apiClient.get('/expenses/categories');
  return data.data;
}

export async function listExpenses(params) {
  const { data } = await apiClient.get('/expenses', { params });
  return data.data;
}

export async function getExpense(id) {
  const { data } = await apiClient.get(`/expenses/${id}`);
  return data.data;
}

export async function createExpense(payload) {
  const { data } = await apiClient.post('/expenses', payload);
  return data.data;
}

export async function updateExpense(id, payload) {
  const { data } = await apiClient.put(`/expenses/${id}`, payload);
  return data.data;
}

export async function deleteExpense(id) {
  await apiClient.delete(`/expenses/${id}`);
}
