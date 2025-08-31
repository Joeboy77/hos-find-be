import { AppDataSource } from '../config/database';
import { User } from '../models/User';

interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
}

interface PushNotificationResult {
  success: boolean;
  message: string;
  details?: any;
}

export class PushNotificationService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  static async sendToUser(userId: string, notification: PushNotificationData): Promise<PushNotificationResult> {
    try {
      console.log(`🔔 [PUSH] Attempting to send notification to user ${userId}`);
      
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        console.log(`❌ [PUSH] User ${userId} not found`);
        return { success: false, message: 'User not found' };
      }

      if (!user.pushToken) {
        console.log(`⚠️ [PUSH] No push token found for user ${userId}`);
        return { success: false, message: 'No push token available' };
      }

      console.log(`🔔 [PUSH] User ${userId} has push token: ${user.pushToken.substring(0, 20)}...`);
      
      const result = await this.sendPushNotificationWithRetry(user.pushToken, notification);
      
      if (result.success) {
        console.log(`✅ [PUSH] Push notification sent successfully to user ${userId}`);
      } else {
        console.error(`❌ [PUSH] Failed to send push notification to user ${userId}:`, result.message);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [PUSH] Error sending push notification to user ${userId}:`, error);
      return { success: false, message: errorMessage };
    }
  }

  static async sendToAllUsers(notification: PushNotificationData): Promise<PushNotificationResult> {
    try {
      console.log(`🔔 [PUSH] Attempting to send notification to all users`);
      
      const userRepository = AppDataSource.getRepository(User);
      const users = await userRepository.find();
      const usersWithTokens = users.filter(user => user.pushToken);

      console.log(`🔔 [PUSH] Found ${users.length} total users, ${usersWithTokens.length} with push tokens`);

      if (usersWithTokens.length === 0) {
        console.log(`⚠️ [PUSH] No users with push tokens found`);
        return { success: false, message: 'No users with push tokens available' };
      }

      const results = await Promise.allSettled(
        usersWithTokens.map(user => 
          this.sendPushNotificationWithRetry(user.pushToken!, notification)
        )
      );

      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;
      
      const failed = results.filter(result => 
        result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)
      ).length;

      console.log(`🔔 [PUSH] Push notification results: ${successful} successful, ${failed} failed`);

      if (successful > 0) {
        return { 
          success: true, 
          message: `Sent to ${successful} users successfully`,
          details: { successful, failed, total: usersWithTokens.length }
        };
      } else {
        return { 
          success: false, 
          message: `Failed to send to any users`,
          details: { successful, failed, total: usersWithTokens.length }
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [PUSH] Error sending push notifications to all users:`, error);
      return { success: false, message: errorMessage };
    }
  }

  private static async sendPushNotificationWithRetry(
    expoPushToken: string, 
    notification: PushNotificationData,
    attempt: number = 1
  ): Promise<PushNotificationResult> {
    try {
      console.log(`🔔 [PUSH] Attempt ${attempt}/${this.MAX_RETRIES} - Sending push notification to Expo...`);
      console.log(`🔔 [PUSH] Push token: ${expoPushToken.substring(0, 20)}...`);
      console.log(`🔔 [PUSH] Message:`, { title: notification.title, body: notification.body });

      const message = {
        to: expoPushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      console.log(`🔔 [PUSH] Expo response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`🔔 [PUSH] Expo HTTP error ${response.status}:`, errorText);
        
        if (attempt < this.MAX_RETRIES && this.shouldRetry(response.status)) {
          console.log(`🔔 [PUSH] Retrying in ${this.RETRY_DELAY}ms...`);
          await this.delay(this.RETRY_DELAY);
          return this.sendPushNotificationWithRetry(expoPushToken, notification, attempt + 1);
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`🔔 [PUSH] Expo response result:`, result);
      
      if (result.data?.status === 'error') {
        const errorMessage = result.data.message || 'Unknown Expo error';
        console.error(`🔔 [PUSH] Expo push error:`, errorMessage);
        
        if (attempt < this.MAX_RETRIES) {
          console.log(`🔔 [PUSH] Retrying in ${this.RETRY_DELAY}ms...`);
          await this.delay(this.RETRY_DELAY);
          return this.sendPushNotificationWithRetry(expoPushToken, notification, attempt + 1);
        }
        
        throw new Error(`Expo push error: ${errorMessage}`);
      }

      console.log(`✅ [PUSH] Push notification sent successfully to Expo on attempt ${attempt}`);
      return { success: true, message: 'Push notification sent successfully' };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [PUSH] Error sending push notification (attempt ${attempt}):`, error);
      
      if (attempt < this.MAX_RETRIES) {
        console.log(`🔔 [PUSH] Retrying in ${this.RETRY_DELAY}ms...`);
        await this.delay(this.RETRY_DELAY);
        return this.sendPushNotificationWithRetry(expoPushToken, notification, attempt + 1);
      }
      
      return { success: false, message: errorMessage };
    }
  }

  private static shouldRetry(status: number): boolean {
    // Retry on server errors (5xx) and some client errors that might be temporary
    return status >= 500 || status === 429 || status === 408;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async sendNewPropertyNotification(propertyName: string, propertyId: string, propertyImage?: string): Promise<PushNotificationResult> {
    console.log(`🔔 [PUSH] Sending new property notification for: ${propertyName}`);
    
    const notification: PushNotificationData = {
      title: 'New Property Available! 🏠',
      body: `${propertyName} has been added to HosFind. Check it out now!`,
      data: {
        type: 'new_property',
        propertyId,
        propertyName,
        propertyImage,
        timestamp: new Date().toISOString(),
      }
    };

    return await this.sendToAllUsers(notification);
  }

  static async sendPropertyUpdateNotification(propertyName: string, propertyId: string, updateMessage: string): Promise<PushNotificationResult> {
    console.log(`🔔 [PUSH] Sending property update notification for: ${propertyName}`);
    
    const notification: PushNotificationData = {
      title: 'Property Update 📝',
      body: `${propertyName}: ${updateMessage}`,
      data: {
        type: 'property_update',
        propertyId,
        propertyName,
        updateMessage,
        timestamp: new Date().toISOString(),
      }
    };

    return await this.sendToAllUsers(notification);
  }

  static async sendNewRoomTypeNotification(roomTypeName: string, propertyName: string, propertyId: string): Promise<PushNotificationResult> {
    console.log(`🔔 [PUSH] Sending new room type notification for: ${roomTypeName} in ${propertyName}`);
    
    const notification: PushNotificationData = {
      title: 'New Room Type Available! 🛏️',
      body: `${roomTypeName} room type has been added to ${propertyName}. Check it out now!`,
      data: {
        type: 'new_room_type',
        roomTypeName,
        propertyId,
        propertyName,
        timestamp: new Date().toISOString(),
      }
    };

    return await this.sendToAllUsers(notification);
  }

  static async sendNewCategoryNotification(categoryName: string): Promise<PushNotificationResult> {
    console.log(`🔔 [PUSH] Sending new category notification for: ${categoryName}`);
    
    const notification: PushNotificationData = {
      title: 'New Category Available! 🏷️',
      body: `${categoryName} category has been added to HosFind. Explore new properties!`,
      data: {
        type: 'new_category',
        categoryName,
        timestamp: new Date().toISOString(),
      }
    };

    return await this.sendToAllUsers(notification);
  }

  static async sendPromotionNotification(title: string, message: string, promotionData?: any): Promise<PushNotificationResult> {
    console.log(`🔔 [PUSH] Sending promotion notification: ${title}`);
    
    const notification: PushNotificationData = {
      title: `🎉 ${title}`,
      body: message,
      data: {
        type: 'promotion',
        ...promotionData,
        timestamp: new Date().toISOString(),
      }
    };

    return await this.sendToAllUsers(notification);
  }

  static async sendSystemNotification(title: string, message: string): Promise<PushNotificationResult> {
    console.log(`🔔 [PUSH] Sending system notification: ${title}`);
    
    const notification: PushNotificationData = {
      title: `🔔 ${title}`,
      body: message,
      data: {
        type: 'system',
        timestamp: new Date().toISOString(),
      }
    };

    return await this.sendToAllUsers(notification);
  }

  static async sendCustomNotification(title: string, message: string, data?: any): Promise<PushNotificationResult> {
    console.log(`🔔 [PUSH] Sending custom notification: ${title}`);
    
    const notification: PushNotificationData = {
      title,
      body: message,
      data: {
        type: 'custom',
        ...data,
        timestamp: new Date().toISOString(),
      }
    };

    return await this.sendToAllUsers(notification);
  }
} 