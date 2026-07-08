import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';
import * as notificationService from '../services/notification.service.js';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await notificationService.listNotifications(req.query, req.user.id);
  return success(res, { data: { items, meta } });
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);
  return success(res, { data: { count } });
});

export const markRead = asyncHandler(async (req, res) => {
  await notificationService.markRead(Number(req.params.id), req.user.id);
  return success(res, { message: 'Notification marked as read' });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user.id);
  return success(res, { message: 'All notifications marked as read' });
});
