import { ApiError } from '../utils/apiError.js';
import * as notificationRepository from '../repositories/notification.repository.js';

export async function listNotifications(query, userId) {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);

  const { rows, total } = await notificationRepository.findAllForUser({ userId, page, limit, status: query.status });

  return { items: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getUnreadCount(userId) {
  return notificationRepository.getUnreadCount(userId);
}

export async function markRead(id, userId) {
  const updated = await notificationRepository.markRead(id, userId);
  if (!updated) throw new ApiError(404, 'Notification not found or already read');
}

export async function markAllRead(userId) {
  await notificationRepository.markAllRead(userId);
}

export async function deleteOne(id, userId) {
  const deleted = await notificationRepository.deleteOne(id, userId);
  if (!deleted) throw new ApiError(404, 'Notification not found');
}

export async function deleteAllForUser(userId) {
  await notificationRepository.deleteAllForUser(userId);
}
