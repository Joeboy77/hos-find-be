import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Admin, AdminRole } from '../models/Admin';
import { Property, PropertyStatus } from '../models/Property';
import { Category } from '../models/Category';
import { RoomType } from '../models/RoomType';
import { User } from '../models/User';
import { Like } from '../models/Like';
import { Notification, NotificationType } from '../models/Notification';
import { NotificationController } from './notificationController';
import { PushNotificationService } from '../services/pushNotificationService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RegionalSection } from '../models/RegionalSection';

type AdminRequest = Request & {
  admin?: {
    id: string;
    email: string;
    role: AdminRole;
  };
};

export class AdminController {
  static async login(req: Request, res: Response, next: NextFunction) {
    console.log('🔑 [ADMIN LOGIN] Starting admin login process');
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required' });
        return;
      }

      const adminRepository = AppDataSource.getRepository(Admin);
      const admin = await adminRepository.findOne({ where: { email: email.toLowerCase() } });

      if (!admin) {
        console.log('❌ [ADMIN LOGIN] Admin not found:', email);
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }

      if (!admin.isActive) {
        console.log('❌ [ADMIN LOGIN] Admin account is inactive:', email);
        res.status(401).json({ success: false, message: 'Account is inactive' });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        console.log('❌ [ADMIN LOGIN] Invalid password for admin:', email);
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }

      // Generate access and refresh tokens
      const accessToken = jwt.sign(
        { adminId: admin.id, email: admin.email, role: admin.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      const refreshToken = jwt.sign(
        { adminId: admin.id, email: admin.email, role: admin.role },
        process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
        { expiresIn: '7d' }
      );

      // Save refresh token to admin
      admin.refreshToken = refreshToken;
      await adminRepository.save(admin);

      console.log('✅ [ADMIN LOGIN] Admin logged in successfully:', email);
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          admin: {
            id: admin.id,
            email: admin.email,
            fullName: admin.fullName,
            role: admin.role,
            isActive: admin.isActive
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error) {
      console.error('❌ [ADMIN LOGIN] Error during login:', error);
      next(error);
    }
  }

  static async getDashboardStats(req: AdminRequest, res: Response): Promise<void> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const adminRepository = AppDataSource.getRepository(Admin);
      const propertyRepository = AppDataSource.getRepository(Property);
      const categoryRepository = AppDataSource.getRepository(Category);
      const likeRepository = AppDataSource.getRepository(Like);
      const notificationRepository = AppDataSource.getRepository(Notification);

      // Basic counts
      const totalUsers = await userRepository.count();
      const totalAdmins = await adminRepository.count();
      const activeUsers = await userRepository.count({ where: { isActive: true } });
      const totalProperties = await propertyRepository.count();
      const activeProperties = await propertyRepository.count({ where: { isActive: true } });
      const featuredProperties = await propertyRepository.count({ where: { isFeatured: true, isActive: true } });
      const totalCategories = await categoryRepository.count();
      const totalLikes = await likeRepository.count();
      const totalNotifications = await notificationRepository.count();
      const unreadNotifications = await notificationRepository.count({ where: { isRead: false } as any });

      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentUsers = await userRepository
        .createQueryBuilder('user')
        .where('user.createdAt >= :startDate', { startDate: sevenDaysAgo })
        .getCount();
      
      const recentProperties = await propertyRepository
        .createQueryBuilder('property')
        .where('property.createdAt >= :startDate', { startDate: sevenDaysAgo })
        .getCount();

      // Property statistics by category
      const propertiesByCategory = await propertyRepository
        .createQueryBuilder('property')
        .leftJoin('property.category', 'category')
        .select('category.name', 'categoryName')
        .addSelect('COUNT(property.id)', 'propertyCount')
        .where('property.isActive = :isActive', { isActive: true })
        .groupBy('category.name')
        .orderBy('COUNT(property.id)', 'DESC')
        .limit(5)
        .getRawMany();

      // Top properties by likes
      const topPropertiesByLikes = await propertyRepository
        .createQueryBuilder('property')
        .leftJoin('property.likes', 'like')
        .select('property.name', 'propertyName')
        .addSelect('COUNT(like.id)', 'likeCount')
        .where('property.isActive = :isActive', { isActive: true })
        .groupBy('property.id, property.name')
        .orderBy('COUNT(like.id)', 'DESC')
        .limit(5)
        .getRawMany();

      // Daily user registrations (last 7 days)
      const dailyUserRegistrations = await userRepository
        .createQueryBuilder('user')
        .select('DATE(user.createdAt)', 'date')
        .addSelect('COUNT(user.id)', 'userCount')
        .where('user.createdAt >= :startDate', { startDate: sevenDaysAgo })
        .groupBy('DATE(user.createdAt)')
        .orderBy('date', 'ASC')
        .getRawMany();

      res.json({
        success: true,
        data: {
          summary: {
            totalUsers,
            totalAdmins,
            activeUsers,
            totalProperties,
            activeProperties,
            featuredProperties,
            totalCategories,
            totalLikes,
            totalNotifications,
            unreadNotifications
          },
          recentActivity: {
            recentUsers,
            recentProperties
          },
          analytics: {
            propertiesByCategory,
            topPropertiesByLikes,
            dailyUserRegistrations
          }
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
    }
  }

  static async getAllUsers(req: AdminRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string || '';
      const offset = (page - 1) * limit;

      const userRepository = AppDataSource.getRepository(User);
      const queryBuilder = userRepository.createQueryBuilder('user');

      if (search) {
        queryBuilder.where(
          'user.fullName ILIKE :search OR user.email ILIKE :search OR user.phoneNumber ILIKE :search',
          { search: `%${search}%` }
        );
      }

      const [users, total] = await queryBuilder
        .orderBy('user.createdAt', 'DESC')
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      res.json({
        success: true,
        data: {
          users: users.map(user => user.toPublicJSON()),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
  }

  static async updateUserStatus(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        res.status(400).json({ success: false, message: 'isActive must be a boolean' });
        return;
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      user.isActive = isActive;
      await userRepository.save(user);

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: user.toPublicJSON()
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ success: false, message: 'Failed to update user status' });
    }
  }

  static async getUserDetails(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      if (!userId) {
        res.status(400).json({ success: false, message: 'User ID is required' });
        return;
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          user: user.toPublicJSON()
        }
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch user details' });
    }
  }

  static async deleteUser(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      if (!userId) {
        res.status(400).json({ success: false, message: 'User ID is required' });
        return;
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      await userRepository.remove(user);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
  }

  static async getUserStats(req: AdminRequest, res: Response): Promise<void> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      
      // Get total users
      const totalUsers = await userRepository.count();
      
      // Get active users
      const activeUsers = await userRepository.count({ where: { isActive: true } });
      

      
      // Get new users this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newUsersThisWeek = await userRepository.count({
        where: { createdAt: { $gte: oneWeekAgo } as any }
      });
      
      // Get new users this month
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const newUsersThisMonth = await userRepository.count({
        where: { createdAt: { $gte: oneMonthAgo } as any }
      });

      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          newUsersThisWeek,
          newUsersThisMonth
        }
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch user stats' });
    }
  }

  // Notification Management Methods
  static async getAllNotifications(req: AdminRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string;
      const isRead = req.query.isRead as string;
      const offset = (page - 1) * limit;

      const notificationRepository = AppDataSource.getRepository(Notification);
      const queryBuilder = notificationRepository.createQueryBuilder('notification')
        .leftJoinAndSelect('notification.user', 'user')
        .orderBy('notification.createdAt', 'DESC');

      // Apply filters
      if (type) {
        queryBuilder.andWhere('notification.type = :type', { type });
      }
      if (isRead !== undefined) {
        queryBuilder.andWhere('notification.isRead = :isRead', { isRead: isRead === 'true' });
      }

      const [notifications, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      res.json({
        success: true,
        data: {
          notifications: notifications.map(n => ({
            ...n.toJSON(),
            user: n.user ? {
              id: n.user.id,
              fullName: n.user.fullName,
              email: n.user.email
            } : null
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
  }

  static async getNotificationStats(req: AdminRequest, res: Response): Promise<void> {
    try {
      const notificationRepository = AppDataSource.getRepository(Notification);
      
      // Get total notifications
      const totalNotifications = await notificationRepository.count();
      
      // Get unread notifications
      const unreadNotifications = await notificationRepository.count({ 
        where: { isRead: false } 
      });
      
      // Get notifications by type
      const notificationsByType = await notificationRepository
        .createQueryBuilder('notification')
        .select('notification.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('notification.type')
        .getRawMany();

      // Get recent notifications (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const recentNotifications = await notificationRepository
        .createQueryBuilder('notification')
        .where('notification.createdAt >= :oneDayAgo', { oneDayAgo })
        .getCount();

      res.json({
        success: true,
        data: {
          totalNotifications,
          unreadNotifications,
          notificationsByType: notificationsByType.map(item => ({
            type: item.type,
            count: item.count.toString()
          })),
          recentNotifications
        }
      });
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch notification stats' });
    }
  }

  static async createNotification(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { title, message, type, targetUsers } = req.body;

      if (!title || !message) {
        res.status(400).json({ success: false, message: 'Title and message are required' });
        return;
      }

      const notificationRepository = AppDataSource.getRepository(Notification);
      const userRepository = AppDataSource.getRepository(User);

      let users: User[] = [];
      
      if (targetUsers === 'all') {
        // Send to all active users
        users = await userRepository.find({ where: { isActive: true } });
      } else if (targetUsers === 'verified') {
        // Send to verified users only
        users = await userRepository.find({ 
          where: { isActive: true, isEmailVerified: true, isPhoneVerified: true } 
        });
      } else if (Array.isArray(targetUsers)) {
        // Send to specific user IDs
        users = await userRepository.findByIds(targetUsers);
      }

      if (users.length === 0) {
        res.status(400).json({ success: false, message: 'No target users found' });
        return;
      }

      // Create notifications for each user
      const notifications = users.map(user => {
        const notification = new Notification();
        notification.title = title;
        notification.message = message;
        notification.type = type || NotificationType.SYSTEM;
        notification.userId = user.id;
        notification.data = { adminCreated: true };
        return notification;
      });

      await notificationRepository.save(notifications);

      // Send push notifications
      try {
        await PushNotificationService.sendSystemNotification(title, message);
      } catch (pushError) {
        console.error('Error sending push notifications:', pushError);
      }

      res.status(201).json({
        success: true,
        message: `Notification sent to ${users.length} users`,
        data: {
          notificationsCreated: notifications.length,
          targetUsers: users.length
        }
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ success: false, message: 'Failed to create notification' });
    }
  }

  static async deleteNotification(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const notificationRepository = AppDataSource.getRepository(Notification);
      const notification = await notificationRepository.findOne({ where: { id } });

      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      await notificationRepository.remove(notification);

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }
  }

  static async markNotificationAsRead(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const notificationRepository = AppDataSource.getRepository(Notification);
      const notification = await notificationRepository.findOne({ where: { id } });

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

  static async createAdmin(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { email, password, fullName, role = AdminRole.ADMIN } = req.body;

      if (!email || !password || !fullName) {
        res.status(400).json({ success: false, message: 'Email, password, and fullName are required' });
        return;
      }

      if (req.admin?.role !== AdminRole.ADMIN) {
        res.status(403).json({ success: false, message: 'Only admins can create new admin accounts' });
        return;
      }

      const adminRepository = AppDataSource.getRepository(Admin);
      const existingAdmin = await adminRepository.findOne({ where: { email: email.toLowerCase() } });

      if (existingAdmin) {
        res.status(400).json({ success: false, message: 'Admin with this email already exists' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const admin = adminRepository.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        fullName,
        role,
        isActive: true
      });

      await adminRepository.save(admin);

      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        data: {
          id: admin.id,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
          isActive: admin.isActive
        }
      });
    } catch (error) {
      console.error('Error creating admin:', error);
      res.status(500).json({ success: false, message: 'Failed to create admin' });
    }
  }

  static async getAllProperties(req: AdminRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string || '';
      const categoryId = req.query.categoryId as string || '';
      const status = req.query.status as string || '';
      const offset = (page - 1) * limit;

      const propertyRepository = AppDataSource.getRepository(Property);
      const queryBuilder = propertyRepository
        .createQueryBuilder('property')
        .leftJoinAndSelect('property.category', 'category');

      if (search) {
        queryBuilder.where(
          'property.name ILIKE :search OR property.description ILIKE :search OR property.location ILIKE :search',
          { search: `%${search}%` }
        );
      }

      if (categoryId) {
        queryBuilder.andWhere('property.categoryId = :categoryId', { categoryId });
      }

      if (status) {
        queryBuilder.andWhere('property.status = :status', { status });
      }

      const [properties, total] = await queryBuilder
        .orderBy('property.createdAt', 'DESC')
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      res.json({
        success: true,
        data: {
          properties: properties.map(property => property.toJSON()),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching properties:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch properties' });
    }
  }

  static async getPropertyDetails(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, message: 'Property ID is required' });
        return;
      }

      const propertyRepository = AppDataSource.getRepository(Property);
      const roomTypeRepository = AppDataSource.getRepository(RoomType);

      const property = await propertyRepository.findOne({
        where: { id },
        relations: ['category']
      });

      if (!property) {
        res.status(404).json({ success: false, message: 'Property not found' });
        return;
      }

      // Get room types for this property
      const roomTypes = await roomTypeRepository.find({
        where: { propertyId: id, isActive: true },
        order: { displayOrder: 'ASC', price: 'ASC' }
      });

      const propertyData = property.toJSON();
      (propertyData as any).roomTypes = roomTypes.map(rt => rt.toJSON());

      res.json({
        success: true,
        data: propertyData
      });
    } catch (error) {
      console.error('Error fetching property details:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch property details' });
    }
  }

  static async createProperty(req: AdminRequest, res: Response): Promise<void> {
    try {
      const {
        name,
        description,
        mainImageUrl,
        additionalImageUrls,
        location,
        city,
        region,
        latitude,
        longitude,
        price,
        currency,
        propertyType,
        categoryId,
        isFeatured,
        displayOrder
      } = req.body;

      if (!name || !description || !mainImageUrl || !location || !city || !region || !price || !propertyType || !categoryId) {
        res.status(400).json({ success: false, message: 'Missing required fields' });
        return;
      }

      const propertyRepository = AppDataSource.getRepository(Property);
      const newProperty = propertyRepository.create({
        name,
        description,
        mainImageUrl,
        additionalImageUrls,
        location,
        city,
        region,
        latitude,
        longitude,
        price,
        currency,
        propertyType,
        categoryId,
        isFeatured,
        displayOrder,
        status: PropertyStatus.ACTIVE,
        isActive: true,
        rating: 0,
        reviewCount: 0
      });

      await propertyRepository.save(newProperty);
      const createdProperty = await propertyRepository.findOne({
        where: { id: newProperty.id },
        relations: ['category']
      });

      // Create notifications for all users about the new property
      try {
        await NotificationController.createNotificationForAllUsers(
          'New Property Available!',
          `${name} has been added to HosFind. Check it out now!`,
          'new_property' as any,
          {
            propertyId: newProperty.id,
            propertyName: name,
            propertyType: propertyType,
            propertyImage: mainImageUrl,
            city: city,
            region: region
          }
        );

        console.log('✅ Notifications created and push notifications sent for new property');
      } catch (notificationError) {
        console.error('⚠️ Error creating notifications:', notificationError);
        // Don't fail the property creation if notifications fail
      }

      res.status(201).json({
        success: true,
        message: 'Property created successfully',
        data: createdProperty!.toJSON()
      });
    } catch (error) {
      console.error('Error creating property:', error);
      res.status(500).json({ success: false, message: 'Failed to create property' });
    }
  }

  static async updateProperty(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        res.status(400).json({ success: false, message: 'Property ID is required' });
        return;
      }

      const propertyRepository = AppDataSource.getRepository(Property);
      const property = await propertyRepository.findOne({ where: { id } });

      if (!property) {
        res.status(404).json({ success: false, message: 'Property not found' });
        return;
      }

      const allowedFields = [
        'name', 'description', 'mainImageUrl', 'additionalImageUrls', 'location',
        'city', 'region', 'latitude', 'longitude', 'price', 'currency',
        'propertyType', 'categoryId', 'isFeatured', 'displayOrder', 'status', 'isActive'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          if (field === 'price' || field === 'latitude' || field === 'longitude') {
            (property as any)[field] = parseFloat(updateData[field]);
          } else if (field === 'isFeatured' || field === 'isActive') {
            (property as any)[field] = Boolean(updateData[field]);
          } else if (field === 'displayOrder') {
            (property as any)[field] = parseInt(updateData[field]);
          } else {
            (property as any)[field] = updateData[field];
          }
        }
      });

      await propertyRepository.save(property);

      const updatedProperty = await propertyRepository.findOne({
        where: { id },
        relations: ['category']
      });

      res.json({
        success: true,
        message: 'Property updated successfully',
        data: updatedProperty!.toJSON()
      });
    } catch (error) {
      console.error('Error updating property:', error);
      res.status(500).json({ success: false, message: 'Failed to update property' });
    }
  }

  static async updatePropertyRating(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { rating } = req.body;

      if (!id || typeof rating !== 'number' || rating < 1 || rating > 5) {
        res.status(400).json({ success: false, message: 'Invalid rating or property ID' });
        return;
      }

      const propertyRepository = AppDataSource.getRepository(Property);
      const property = await propertyRepository.findOne({ where: { id } });

      if (!property) {
        res.status(404).json({ success: false, message: 'Property not found' });
        return;
      }

      property.rating = rating;
      await propertyRepository.save(property);

      res.json({
        success: true,
        message: 'Property rating updated successfully',
        data: property.toJSON()
      });
    } catch (error) {
      console.error('Error updating property rating:', error);
      res.status(500).json({ success: false, message: 'Failed to update property rating' });
    }
  }

  static async bulkUpdatePropertyStatuses(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { propertyIds, status, isActive } = req.body;

      if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
        res.status(400).json({ success: false, message: 'Property IDs are required' });
        return;
      }

      if (typeof status !== 'string' || !Object.values(PropertyStatus).includes(status as PropertyStatus)) {
        res.status(400).json({ success: false, message: 'Invalid status provided' });
        return;
      }

      if (typeof isActive !== 'boolean') {
        res.status(400).json({ success: false, message: 'isActive must be a boolean' });
        return;
      }

      const propertyRepository = AppDataSource.getRepository(Property);
      const properties = await propertyRepository.findByIds(propertyIds);

      if (properties.length === 0) {
        res.status(404).json({ success: false, message: 'No properties found with the provided IDs' });
        return;
      }

      for (const property of properties) {
        property.status = status as PropertyStatus;
        property.isActive = isActive;
        await propertyRepository.save(property);
      }

      res.json({
        success: true,
        message: `Successfully updated ${properties.length} properties`,
        data: properties.map(p => p.toJSON())
      });
    } catch (error) {
      console.error('Error bulk updating property statuses:', error);
      res.status(500).json({ success: false, message: 'Failed to bulk update property statuses' });
    }
  }

  static async deleteProperty(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, message: 'Property ID is required' });
        return;
      }

      const propertyRepository = AppDataSource.getRepository(Property);
      const property = await propertyRepository.findOne({ where: { id } });

      if (!property) {
        res.status(404).json({ success: false, message: 'Property not found' });
        return;
      }

      property.isActive = false;
      await propertyRepository.save(property);

      res.json({
        success: true,
        message: 'Property deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting property:', error);
      res.status(500).json({ success: false, message: 'Failed to delete property' });
    }
  }

  static async updatePropertyStatus(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, isActive } = req.body;

      if (!id) {
        res.status(400).json({ success: false, message: 'Property ID is required' });
        return;
      }

      const propertyRepository = AppDataSource.getRepository(Property);
      const property = await propertyRepository.findOne({ where: { id } });

      if (!property) {
        res.status(404).json({ success: false, message: 'Property not found' });
        return;
      }

      if (status) {
        property.status = status;
      }

      if (typeof isActive === 'boolean') {
        property.isActive = isActive;
      }

      await propertyRepository.save(property);

      res.json({
        success: true,
        message: 'Property status updated successfully',
        data: property.toJSON()
      });
    } catch (error) {
      console.error('Error updating property status:', error);
      res.status(500).json({ success: false, message: 'Failed to update property status' });
    }
  }

  static async getAllCategories(req: AdminRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string || '';
      const offset = (page - 1) * limit;

      const categoryRepository = AppDataSource.getRepository(Category);
      const queryBuilder = categoryRepository.createQueryBuilder('category');

      if (search) {
        queryBuilder.where(
          'category.name ILIKE :search OR category.description ILIKE :search',
          { search: `%${search}%` }
        );
      }

      const [categories, total] = await queryBuilder
        .orderBy('category.displayOrder', 'ASC')
        .addOrderBy('category.createdAt', 'DESC')
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      res.json({
        success: true,
        data: categories.map(category => category.toJSON())
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
  }

  static async getCategoryDetails(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, message: 'Category ID is required' });
        return;
      }

      const categoryRepository = AppDataSource.getRepository(Category);
      const propertyRepository = AppDataSource.getRepository(Property);

      const category = await categoryRepository.findOne({
        where: { id }
      });

      if (!category) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }

      // Get all properties in this category
      const properties = await propertyRepository.find({
        where: { categoryId: id, isActive: true },
        order: { displayOrder: 'ASC', createdAt: 'DESC' }
      });

      const categoryData = category.toJSON();
      (categoryData as any).properties = properties.map(p => p.toJSON());

      res.json({
        success: true,
        data: categoryData
      });
    } catch (error) {
      console.error('Error fetching category details:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch category details' });
    }
  }

  static async updateCategoryStatus(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive, displayOrder } = req.body;
      if (!id) {
        res.status(400).json({ success: false, message: 'Category ID is required' });
        return;
      }
      const categoryRepository = AppDataSource.getRepository(Category);
      const category = await categoryRepository.findOne({ where: { id } });
      if (!category) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }
      if (isActive !== undefined) category.isActive = isActive;
      if (displayOrder !== undefined) category.displayOrder = displayOrder;
      await categoryRepository.save(category);
      res.json({
        success: true,
        message: 'Category status updated successfully',
        data: category.toJSON()
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update category status' });
    }
  }

  static async createCategory(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { name, description, imageUrl, type, displayOrder = 0, icon, color } = req.body;
      
      if (!name || !icon || !color) {
        res.status(400).json({ 
          success: false, 
          message: 'Category name, icon, and color are required' 
        });
        return;
      }

      const categoryRepository = AppDataSource.getRepository(Category);
      const existingCategory = await categoryRepository.findOne({ 
        where: { name: name.toLowerCase() } 
      });
      
      if (existingCategory) {
        res.status(400).json({ 
          success: false, 
          message: 'Category with this name already exists' 
        });
        return;
      }

      const newCategory = categoryRepository.create({
        name: name.toLowerCase(),
        description: description || null,
        imageUrl: imageUrl || null,
        type: type || null,
        icon,
        color,
        displayOrder,
        isActive: true,
        propertyCount: 0
      });
      
      await categoryRepository.save(newCategory);

      // Create notification for all users about the new category
      try {
        await NotificationController.createNotificationForAllUsers(
          'New Property Category! 🏘️',
          `A new ${name} category has been added. Explore properties in this category now!`,
          NotificationType.SYSTEM,
          {
            type: 'new_category',
            categoryId: newCategory.id,
            categoryName: name
          }
        );
      } catch (notificationError) {
        console.error('Error creating notification for new category:', notificationError);
        // Don't fail the category creation if notification fails
      }

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: newCategory.toJSON()
      });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ success: false, message: 'Failed to create category' });
    }
  }

  static async updateCategory(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, imageUrl, type, displayOrder, icon, color } = req.body;

      if (!id) {
        res.status(400).json({ success: false, message: 'Category ID is required' });
        return;
      }

      const categoryRepository = AppDataSource.getRepository(Category);
      const category = await categoryRepository.findOne({ where: { id } });

      if (!category) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }

      if (name) category.name = name.toLowerCase();
      if (description !== undefined) category.description = description;
      if (imageUrl !== undefined) category.imageUrl = imageUrl;
      if (type !== undefined) category.type = type;
      if (icon !== undefined) category.icon = icon;
      if (color !== undefined) category.color = color;
      if (displayOrder !== undefined) category.displayOrder = displayOrder;

      await categoryRepository.save(category);

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: category.toJSON()
      });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ success: false, message: 'Failed to update category' });
    }
  }

  static async deleteCategory(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, message: 'Category ID is required' });
        return;
      }

      const categoryRepository = AppDataSource.getRepository(Category);
      const propertyRepository = AppDataSource.getRepository(Property);

      const category = await categoryRepository.findOne({ where: { id } });
      if (!category) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }

      // Check if category has active properties
      const activeProperties = await propertyRepository.count({
        where: { categoryId: id, isActive: true }
      });

      if (activeProperties > 0) {
        res.status(400).json({
          success: false,
          message: `Cannot delete category. It has ${activeProperties} active properties.`
        });
        return;
      }

      category.isActive = false;
      await categoryRepository.save(category);

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ success: false, message: 'Failed to delete category' });
    }
  }

  static async getAllRoomTypes(req: AdminRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string || '';
      const propertyId = req.query.propertyId as string || '';
      const offset = (page - 1) * limit;

      const roomTypeRepository = AppDataSource.getRepository(RoomType);
      const queryBuilder = roomTypeRepository
        .createQueryBuilder('roomType')
        .leftJoinAndSelect('roomType.property', 'property');

      if (search) {
        queryBuilder.where(
          'roomType.name ILIKE :search OR roomType.description ILIKE :search',
          { search: `%${search}%` }
        );
      }

      if (propertyId) {
        queryBuilder.andWhere('roomType.propertyId = :propertyId', { propertyId });
      }

      const [roomTypes, total] = await queryBuilder
        .orderBy('roomType.displayOrder', 'ASC')
        .addOrderBy('roomType.createdAt', 'DESC')
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      res.json({
        success: true,
        data: roomTypes.map(roomType => roomType.toJSON())
      });
    } catch (error) {
      console.error('Error fetching room types:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch room types' });
    }
  }

  static async getRoomTypeDetails(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, message: 'Room type ID is required' });
        return;
      }

      const roomTypeRepository = AppDataSource.getRepository(RoomType);
      const propertyRepository = AppDataSource.getRepository(Property);

      const roomType = await roomTypeRepository.findOne({
        where: { id }
      });

      if (!roomType) {
        res.status(404).json({ success: false, message: 'Room type not found' });
        return;
      }

      // Get the associated property details
      const property = await propertyRepository.findOne({
        where: { id: roomType.propertyId },
        relations: ['category']
      });

      const roomTypeData = roomType.toJSON();
      (roomTypeData as any).property = property ? property.toJSON() : null;

      res.json({
        success: true,
        data: roomTypeData
      });
    } catch (error) {
      console.error('Error fetching room type details:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch room type details' });
    }
  }

  static async createRoomType(req: AdminRequest, res: Response): Promise<void> {
    try {
      const {
        name,
        description,
        price,
        currency,
        genderType,
        capacity,
        roomTypeCategory,
        isAvailable,
        availableRooms,
        totalRooms,
        amenities,
        imageUrl,
        additionalImageUrls,
        propertyId,
        displayOrder
      } = req.body;

      if (!name || !description || !price || !capacity || !genderType || !propertyId) {
        res.status(400).json({ success: false, message: 'Missing required fields' });
        return;
      }

      const roomTypeRepository = AppDataSource.getRepository(RoomType);
      const propertyRepository = AppDataSource.getRepository(Property);

      // Verify property exists
      const property = await propertyRepository.findOne({ where: { id: propertyId } });
      if (!property) {
        res.status(400).json({ success: false, message: 'Property not found' });
        return;
      }

      const roomType = roomTypeRepository.create({
        name,
        description,
        price: parseFloat(price),
        currency: currency || '₵',
        genderType: genderType || 'any',
        capacity: parseInt(capacity) || 1,
        roomTypeCategory,
        isAvailable: isAvailable !== false,
        availableRooms: parseInt(availableRooms) || 0,
        totalRooms: parseInt(totalRooms) || 1,
        amenities: amenities || [],
        imageUrl,
        additionalImageUrls: additionalImageUrls || [],
        propertyId: req.body.propertyId,
        displayOrder: parseInt(displayOrder) || 0,
        isActive: true
      });

      await roomTypeRepository.save(roomType);

      // Create notification for all users about the new room type
      try {
        await NotificationController.createNotificationForAllUsers(
          'New Room Type Available! 🏠',
          `A new ${name} room type has been added to ${property.name}. Check it out now!`,
          NotificationType.SYSTEM,
          {
            type: 'new_room_type',
            roomTypeId: roomType.id,
            propertyId: property.id,
            propertyName: property.name
          }
        );
      } catch (notificationError) {
        console.error('Error creating notification for new room type:', notificationError);
        // Don't fail the room type creation if notification fails
      }

      res.status(201).json({
        success: true,
        message: 'Room type created successfully',
        data: roomType.toJSON()
      });
    } catch (error) {
      console.error('Error creating room type:', error);
      res.status(500).json({ success: false, message: 'Failed to create room type' });
    }
  }

  static async updateRoomType(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const roomTypeRepository = AppDataSource.getRepository(RoomType);
      const roomType = await roomTypeRepository.findOne({ where: { id } });
      
      if (!roomType) {
        res.status(404).json({ success: false, message: 'Room type not found' });
        return;
      }

      const updateData = req.body;
      const allowedFields = [
        'name', 'description', 'price', 'currency', 'genderType', 'capacity',
        'roomTypeCategory', 'isAvailable', 'availableRooms', 'totalRooms',
        'amenities', 'imageUrl', 'additionalImageUrls', 'displayOrder', 'isActive'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          if (field === 'price') {
            (roomType as any)[field] = parseFloat(updateData[field]);
          } else if (field === 'capacity' || field === 'availableRooms' || field === 'totalRooms' || field === 'displayOrder') {
            (roomType as any)[field] = parseInt(updateData[field]);
          } else {
            (roomType as any)[field] = updateData[field];
          }
        }
      });

      await roomTypeRepository.save(roomType);
      res.json({
        success: true,
        message: 'Room type updated successfully',
        data: roomType.toJSON()
      });
    } catch (error) {
      console.error('Error updating room type:', error);
      res.status(500).json({ success: false, message: 'Failed to update room type' });
    }
  }

  static async deleteRoomType(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const roomTypeRepository = AppDataSource.getRepository(RoomType);
      const roomType = await roomTypeRepository.findOne({ where: { id } });
      
      if (!roomType) {
        res.status(404).json({ success: false, message: 'Room type not found' });
        return;
      }

      roomType.isActive = false;
      await roomTypeRepository.save(roomType);
      res.json({
        success: true,
        message: 'Room type deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting room type:', error);
      res.status(500).json({ success: false, message: 'Failed to delete room type' });
    }
  }

  static async getCategoryStats(req: AdminRequest, res: Response): Promise<void> {
    try {
      const categoryRepository = AppDataSource.getRepository(Category);
      const propertyRepository = AppDataSource.getRepository(Property);

      const categories = await categoryRepository.find({
        select: ['id', 'name', 'type', 'isActive', 'propertyCount'],
        order: { displayOrder: 'ASC', createdAt: 'DESC' }
      });

      const stats = await Promise.all(categories.map(async category => {
        const activeProperties = await propertyRepository.count({
          where: { categoryId: category.id, isActive: true }
        });
        return {
          ...category,
          activePropertiesCount: activeProperties
        };
      }));

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching category stats:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch category stats' });
    }
  }

  // Admin Profile Management
  static async getAdminProfile(req: AdminRequest, res: Response): Promise<void> {
    try {
      const admin = await AppDataSource.getRepository(Admin).findOne({
        where: { id: req.admin!.id }
      });

      if (!admin) {
        res.status(404).json({ success: false, message: 'Admin not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          id: admin.id,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          lastLoginAt: admin.lastLoginAt,
          createdAt: admin.createdAt
        }
      });
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch admin profile' });
    }
  }

  static async updateAdminProfile(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { fullName, email, currentPassword, newPassword } = req.body;
      const adminRepository = AppDataSource.getRepository(Admin);
      const admin = await adminRepository.findOne({ where: { id: req.admin!.id } });

      if (!admin) {
        res.status(404).json({ success: false, message: 'Admin not found' });
        return;
      }

      if (fullName) admin.fullName = fullName;
      if (email) admin.email = email.toLowerCase();

      if (newPassword) {
        if (!currentPassword) {
          res.status(400).json({ success: false, message: 'Current password is required to set new password' });
          return;
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
        if (!isCurrentPasswordValid) {
          res.status(400).json({ success: false, message: 'Current password is incorrect' });
          return;
        }

        if (newPassword.length < 6) {
          res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
          return;
        }

        admin.password = await bcrypt.hash(newPassword, 10);
      }

      await adminRepository.save(admin);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: admin.id,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          lastLoginAt: admin.lastLoginAt,
          createdAt: admin.createdAt
        }
      });
    } catch (error) {
      console.error('Error updating admin profile:', error);
      res.status(500).json({ success: false, message: 'Failed to update admin profile' });
    }
  }

  // App Settings Management
  static async getAppSettings(req: AdminRequest, res: Response): Promise<void> {
    try {
      // For now, return default settings. In a real app, these would come from a settings table
      res.json({
        success: true,
        data: {
          appName: process.env.APP_NAME || 'HosFind Admin',
          appVersion: process.env.APP_VERSION || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          maintenanceMode: false,
          allowRegistrations: true,
          requireEmailVerification: true,
          requirePhoneVerification: false
        }
      });
    } catch (error) {
      console.error('Error fetching app settings:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch app settings' });
    }
  }

  static async updateAppSettings(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { maintenanceMode, allowRegistrations, requireEmailVerification, requirePhoneVerification } = req.body;

      // In a real app, these would be saved to a settings table
      // For now, we'll just return success
      console.log('App settings updated:', {
        maintenanceMode,
        allowRegistrations,
        requireEmailVerification,
        requirePhoneVerification
      });

      res.json({
        success: true,
        message: 'App settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating app settings:', error);
      res.status(500).json({ success: false, message: 'Failed to update app settings' });
    }
  }

  // Test Push Notification
  static async testPushNotification(req: AdminRequest, res: Response): Promise<void> {
    try {
      console.log('🧪 [TEST] Testing push notification...');
      
      // Test sending push notification to all users
      await NotificationController.createNotificationForAllUsers(
        'Test Push Notification',
        'This is a test push notification from the admin panel!',
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

  // Regional Sections Management
  static async createRegionalSection(req: Request, res: Response) {
    try {
      const { name, displayOrder = 0 } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Regional section name is required"
        });
      }

      const regionalSection = AppDataSource.getRepository(RegionalSection).create({
        name,
        displayOrder,
        propertyCount: 0,
        isActive: true
      });

      const savedSection = await AppDataSource.getRepository(RegionalSection).save(regionalSection);

      res.status(201).json({
        success: true,
        message: "Regional section created successfully",
        data: savedSection
      });
    } catch (error) {
      console.error("Error creating regional section:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create regional section",
        error: error.message
      });
    }
  }

  static async getAllRegionalSections(req: Request, res: Response) {
    try {
      const sections = await AppDataSource.getRepository(RegionalSection)
        .find({
          order: { displayOrder: "ASC", createdAt: "DESC" }
        });

      res.json({
        success: true,
        data: sections
      });
    } catch (error) {
      console.error("Error fetching regional sections:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch regional sections",
        error: error.message
      });
    }
  }

  static async getRegionalSectionById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const regionalSection = await AppDataSource.getRepository(RegionalSection).findOne({
        where: { id }
      });

      if (!regionalSection) {
        return res.status(404).json({
          success: false,
          message: "Regional section not found"
        });
      }

      res.json({
        success: true,
        data: regionalSection
      });
    } catch (error) {
      console.error("Error fetching regional section:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch regional section",
        error: error.message
      });
    }
  }

  static async updateRegionalSection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, displayOrder, isActive } = req.body;

      const section = await AppDataSource.getRepository(RegionalSection).findOne({
        where: { id }
      });

      if (!section) {
        return res.status(404).json({
          success: false,
          message: "Regional section not found"
        });
      }

      if (name) section.name = name;
      if (displayOrder !== undefined) section.displayOrder = displayOrder;
      if (isActive !== undefined) section.isActive = isActive;

      const updatedSection = await AppDataSource.getRepository(RegionalSection).save(section);

      res.json({
        success: true,
        message: "Regional section updated successfully",
        data: updatedSection
      });
    } catch (error) {
      console.error("Error updating regional section:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update regional section",
        error: error.message
      });
    }
  }

  static async deleteRegionalSection(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if any properties are using this regional section
      const propertiesCount = await AppDataSource.getRepository(Property).count({
        where: { regionalSectionId: id }
      });

      if (propertiesCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete regional section. ${propertiesCount} properties are currently assigned to it.`
        });
      }

      const result = await AppDataSource.getRepository(RegionalSection).delete(id);

      if (result.affected === 0) {
        return res.status(404).json({
          success: false,
          message: "Regional section not found"
        });
      }

      res.json({
        success: true,
        message: "Regional section deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting regional section:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete regional section",
        error: error.message
      });
    }
  }

  static async assignPropertyToRegionalSection(req: Request, res: Response) {
    try {
      const { propertyId, regionalSectionId } = req.body;

      if (!propertyId || !regionalSectionId) {
        return res.status(400).json({
          success: false,
          message: "Property ID and Regional Section ID are required"
        });
      }

      const property = await AppDataSource.getRepository(Property).findOne({
        where: { id: propertyId }
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: "Property not found"
        });
      }

      const regionalSection = await AppDataSource.getRepository(RegionalSection).findOne({
        where: { id: regionalSectionId }
      });

      if (!regionalSection) {
        return res.status(404).json({
          success: false,
          message: "Regional section not found"
        });
      }

      // Update property's regional section
      property.regionalSectionId = regionalSectionId;
      await AppDataSource.getRepository(Property).save(property);

      // Update property count in regional section
      const propertyCount = await AppDataSource.getRepository(Property).count({
        where: { regionalSectionId }
      });
      
      regionalSection.propertyCount = propertyCount;
      await AppDataSource.getRepository(RegionalSection).save(regionalSection);

      res.json({
        success: true,
        message: "Property assigned to regional section successfully",
        data: { property, regionalSection }
      });
    } catch (error) {
      console.error("Error assigning property to regional section:", error);
      res.status(500).json({
        success: false,
        message: "Failed to assign property to regional section",
        error: error.message
      });
    }
  }
}
