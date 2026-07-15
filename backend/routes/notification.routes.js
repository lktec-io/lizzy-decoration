import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

// No dedicated permission gate — every authenticated user manages their own
// notification inbox, the same way every user has their own Profile.
router.use(authenticate);

router.get('/', notificationController.list);
router.get('/unread-count', notificationController.unreadCount);
router.patch('/:id/read', notificationController.markRead);
router.patch('/read-all', notificationController.markAllRead);
router.delete('/all', notificationController.removeAll);
router.delete('/:id', notificationController.remove);

export default router;
