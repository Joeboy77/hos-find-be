import express from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();

router.get('/', authenticateToken, NotificationController.getNotifications);
router.get('/unread-count', authenticateToken, NotificationController.getUnreadCount);
router.put('/:id/read', authenticateToken, NotificationController.markAsRead);
router.put('/mark-all-read', authenticateToken, NotificationController.markAllAsRead);
router.delete('/:id', authenticateToken, NotificationController.deleteNotification);
router.post('/register-push-token', authenticateToken, NotificationController.registerPushToken);
router.post('/test-push-notification', authenticateToken, NotificationController.testPushNotification);

export default router; 