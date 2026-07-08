import apiClient from './apiClient';

export async function listNotifications(params) {
  const { data } = await apiClient.get('/notifications', { params });
  return data.data;
}

export async function getUnreadCount() {
  const { data } = await apiClient.get('/notifications/unread-count');
  return data.data.count;
}

export async function markNotificationRead(id) {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await apiClient.patch('/notifications/read-all');
}
