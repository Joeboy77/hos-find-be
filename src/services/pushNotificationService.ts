import { AppDataSource } from '../config/database';
import { User } from '../models/User';

interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
}

export class PushNotificationService {
  static async sendToUser(userId: string, notification: PushNotificationData): Promise<void> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user || !user.pushToken) {
        console.log(`No push token found for user ${userId}`);
        return;
      }

      await this.sendPushNotification(user.pushToken, notification);
      console.log(`Push notification sent to user ${userId}`);
    } catch (error) {
      console.error(`Error sending push notification to user ${userId}:`, error);
    }
  }

  static async sendToAllUsers(notification: PushNotificationData): Promise<void> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const users = await userRepository.find();
      const usersWithTokens = users.filter(user => user.pushToken);

      console.log(`Sending push notification to ${usersWithTokens.length} users`);

      const promises = usersWithTokens.map(user => 
        this.sendPushNotification(user.pushToken!, notification)
      );

      await Promise.allSettled(promises);
      console.log('Push notifications sent to all users');
    } catch (error) {
      console.error('Error sending push notifications to all users:', error);
    }
  }

  private static async sendPushNotification(
    expoPushToken: string, 
    notification: PushNotificationData
  ): Promise<void> {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.data?.status === 'error') {
        throw new Error(`Expo push error: ${result.data.message}`);
      }

      console.log('Push notification sent successfully');
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  static async sendNewPropertyNotification(propertyName: string, propertyId: string, propertyImage?: string): Promise<void> {
    const notification: PushNotificationData = {
      title: 'New Property Available!',
      body: `${propertyName} has been added to HosFind. Check it out now!`,
      data: {
        type: 'new_property',
        propertyId,
        propertyName,
        propertyImage,
      }
    };

    await this.sendToAllUsers(notification);
  }

  static async sendPropertyUpdateNotification(propertyName: string, propertyId: string, updateMessage: string): Promise<void> {
    const notification: PushNotificationData = {
      title: 'Property Update',
      body: `${propertyName}: ${updateMessage}`,
      data: {
        type: 'property_update',
        propertyId,
        propertyName,
      }
    };

    await this.sendToAllUsers(notification);
  }

  static async sendPromotionNotification(title: string, message: string, promotionData?: any): Promise<void> {
    const notification: PushNotificationData = {
      title,
      body: message,
      data: {
        type: 'promotion',
        ...promotionData,
      }
    };

    await this.sendToAllUsers(notification);
  }

  static async sendSystemNotification(title: string, message: string): Promise<void> {
    const notification: PushNotificationData = {
      title,
      body: message,
      data: {
        type: 'system',
      }
    };

    await this.sendToAllUsers(notification);
  }
} 