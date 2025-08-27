import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Notification, NotificationType } from '../models/Notification';
import { User } from '../models/User';
import { PushNotificationService } from '../services/pushNotificationService';

type AuthRequest = Request & {
  user?: {
    id: string;
    email: string;
    phoneNumber: string;
  };
};

export class NotificationController {
  static async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const notificationRepository = AppDataSource.getRepository(Notification);
      
      const [notifications, total] = await notificationRepository.findAndCount({
        where: { userId },
        order: { createdAt: 'DESC' },
        skip: offset,
        take: limit
      });

      res.json({
        success: true,
        data: {
          notifications,
          totalCount: total,
          currentPage: page,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
  }

  static async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const notificationRepository = AppDataSource.getRepository(Notification);
      const unreadCount = await notificationRepository.count({
        where: { userId, isRead: false }
      });

      res.json({
        success: true,
        data: { unreadCount }
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
    }
  }

  static async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const notificationRepository = AppDataSource.getRepository(Notification);
      const notification = await notificationRepository.findOne({
        where: { id, userId }
      });

      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      notification.isRead = true;
      await notificationRepository.save(notification);

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
    }
  }

  static async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const notificationRepository = AppDataSource.getRepository(Notification);
      await notificationRepository.update(
        { userId, isRead: false },
        { isRead: true }
      );

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
    }
  }

  static async deleteNotification(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const notificationRepository = AppDataSource.getRepository(Notification);
      const notification = await notificationRepository.findOne({
        where: { id, userId }
      });

      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      await notificationRepository.remove(notification);

      res.json({
        success: true,
        message: 'Notification deleted'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }
  }

  static async registerPushToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('🔔 [PUSH] Register push token request received');
      console.log('🔔 [PUSH] Request body:', req.body);
      console.log('🔔 [PUSH] Request user:', req.user);
      
      const userId = req.user?.id;
      const { pushToken } = req.body;

      console.log('🔔 [PUSH] User ID:', userId);
      console.log('🔔 [PUSH] Push token:', pushToken);

      if (!userId) {
        console.log('❌ [PUSH] No user ID found in request');
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      if (!pushToken) {
        console.log('❌ [PUSH] No push token provided in request body');
        res.status(400).json({ success: false, message: 'Push token is required' });
        return;
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        console.log('❌ [PUSH] User not found in database:', userId);
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      console.log('🔔 [PUSH] Found user:', user.email);
      console.log('🔔 [PUSH] Current push token:', user.pushToken);
      console.log('🔔 [PUSH] New push token:', pushToken);

      user.pushToken = pushToken;
      await userRepository.save(user);

      console.log('✅ [PUSH] Push token saved successfully for user:', userId);

      res.json({
        success: true,
        message: 'Push token registered successfully'
      });
    } catch (error) {
      console.error('❌ [PUSH] Error registering push token:', error);
      res.status(500).json({ success: false, message: 'Failed to register push token' });
    }
  }

  static async createNotificationForAllUsers(
    title: string,
    message: string,
    type: NotificationType = NotificationType.SYSTEM,
    data?: any
  ): Promise<void> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const notificationRepository = AppDataSource.getRepository(Notification);

      const users = await userRepository.find();

      const notifications = users.map(user => {
        const notification = new Notification();
        notification.title = title;
        notification.message = message;
        notification.type = type;
        notification.data = data;
        notification.userId = user.id;
        return notification;
      });

      await notificationRepository.save(notifications);

      console.log(`Created ${notifications.length} notifications for all users`);

      // Send push notifications to all users
      await PushNotificationService.sendToAllUsers({
        title,
        body: message,
        data: {
          type,
          ...data
        }
      });

      console.log('Push notifications sent to all users');
    } catch (error) {
      console.error('Error creating notifications for all users:', error);
    }
  }

  static async createNotificationForUser(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.SYSTEM,
    data?: any
  ): Promise<void> {
    try {
      const notificationRepository = AppDataSource.getRepository(Notification);

      const notification = new Notification();
      notification.title = title;
      notification.message = message;
      notification.type = type;
      notification.data = data;
      notification.userId = userId;

      await notificationRepository.save(notification);

      console.log(`Created notification for user ${userId}`);

      // Send push notification to the specific user
      await PushNotificationService.sendToUser(userId, {
        title,
        body: message,
        data: {
          type,
          ...data
        }
      });

      console.log(`Push notification sent to user ${userId}`);
    } catch (error) {
      console.error('Error creating notification for user:', error);
    }
  }

  static async testPushNotification(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('🧪 [TEST] User testing push notification...');
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      // Get the user to check if they have a push token
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (!user.pushToken) {
        res.status(400).json({ success: false, message: 'No push token registered for this user' });
        return;
      }

      console.log('🧪 [TEST] Sending test push notification to user:', userId);
      console.log('🧪 [TEST] User push token:', user.pushToken);

      // Create a test notification for this specific user
      await NotificationController.createNotificationForUser(
        userId,
        'Test Push Notification',
        'This is a test push notification! If you see this, push notifications are working correctly.',
        'test' as any,
        {
          type: 'test',
          timestamp: new Date().toISOString()
        }
      );

      res.json({
        success: true,
        message: 'Test push notification sent successfully'
      });
    } catch (error) {
      console.error('Error sending test push notification:', error);
      res.status(500).json({ success: false, message: 'Failed to send test push notification' });
    }
  }
} 