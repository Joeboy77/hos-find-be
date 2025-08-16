import { AppDataSource } from '../config/database';
import { Notification, NotificationType } from '../models/Notification';
import { User } from '../models/User';

async function seedNotifications() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    const userRepository = AppDataSource.getRepository(User);
    const notificationRepository = AppDataSource.getRepository(Notification);

    const users = await userRepository.find();
    
    if (users.length === 0) {
      console.log('❌ No users found. Please seed users first.');
      return;
    }

    console.log(`📝 Found ${users.length} users, creating notifications...`);

    const sampleNotifications = [
      {
        title: 'New Hostel Available!',
        message: 'A new hostel has been added in Accra. Check it out now!',
        type: NotificationType.NEW_PROPERTY,
        data: {
          propertyId: 'sample-property-1',
          propertyName: 'Accra Central Hostel',
          propertyImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
        }
      },
      {
        title: 'Property Update',
        message: 'The KNUST Student Hostel has updated their room availability.',
        type: NotificationType.PROPERTY_UPDATE,
        data: {
          propertyId: 'sample-property-2',
          propertyName: 'KNUST Student Hostel',
          propertyImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
        }
      },
      {
        title: 'Special Promotion',
        message: 'Get 20% off on all homestays this weekend!',
        type: NotificationType.PROMOTION,
        data: {
          promotionCode: 'WEEKEND20',
          validUntil: '2024-12-31'
        }
      },
      {
        title: 'System Maintenance',
        message: 'We will be performing maintenance on Sunday from 2-4 AM. Some features may be temporarily unavailable.',
        type: NotificationType.SYSTEM
      },
      {
        title: 'New Hotel in Kumasi',
        message: 'Luxury hotel now available in Kumasi with premium amenities.',
        type: NotificationType.NEW_PROPERTY,
        data: {
          propertyId: 'sample-property-3',
          propertyName: 'Kumasi Luxury Hotel',
          propertyImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
        }
      }
    ];

    const notifications = [];

    for (const user of users) {
      for (const sampleNotification of sampleNotifications) {
        const notification = new Notification();
        notification.title = sampleNotification.title;
        notification.message = sampleNotification.message;
        notification.type = sampleNotification.type;
        notification.data = sampleNotification.data;
        notification.userId = user.id;
        notification.isRead = Math.random() > 0.5; // Randomly mark some as read
        
        // Set random creation dates within the last 7 days
        const randomDaysAgo = Math.floor(Math.random() * 7);
        const randomHoursAgo = Math.floor(Math.random() * 24);
        const randomMinutesAgo = Math.floor(Math.random() * 60);
        
        notification.createdAt = new Date(Date.now() - 
          (randomDaysAgo * 24 * 60 * 60 * 1000) - 
          (randomHoursAgo * 60 * 60 * 1000) - 
          (randomMinutesAgo * 60 * 1000)
        );
        
        notifications.push(notification);
      }
    }

    await notificationRepository.save(notifications);

    console.log(`✅ Successfully created ${notifications.length} notifications for ${users.length} users`);
    
    // Count unread notifications
    const unreadCount = await notificationRepository.count({ where: { isRead: false } });
    console.log(`📊 Total unread notifications: ${unreadCount}`);

  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
  } finally {
    await AppDataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

seedNotifications(); 