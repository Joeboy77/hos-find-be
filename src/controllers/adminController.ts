import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Admin, AdminRole } from '../models/Admin';

interface AdminRequest extends Request {
  admin?: Admin;
}

export class AdminController {
  // Get system statistics
  static async getDashboardStats(req: AdminRequest, res: Response) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const adminRepository = AppDataSource.getRepository(Admin);

      const totalUsers = await userRepository.count();
      const totalAdmins = await adminRepository.count();
      const activeUsers = await userRepository.count({ where: { isActive: true } });

      res.json({
        success: true,
        data: {
          totalUsers,
          totalAdmins,
          activeUsers,
          systemStatus: 'healthy'
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
    }
  }

  // Get all users (with pagination)
  static async getAllUsers(req: AdminRequest, res: Response) {
    try {
      const { page = 1, limit = 20, search = '' } = req.query;
      const userRepository = AppDataSource.getRepository(User);

      const queryBuilder = userRepository.createQueryBuilder('user');
      
      if (search) {
        queryBuilder.where(
          'user.fullName ILIKE :search OR user.email ILIKE :search OR user.phoneNumber ILIKE :search',
          { search: `%${search}%` }
        );
      }

      const [users, total] = await queryBuilder
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit))
        .orderBy('user.createdAt', 'DESC')
        .getManyAndCount();

      res.json({
        success: true,
        data: {
          users: users.map(user => user.toPublicJSON()),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
  }

  // Update user status (activate/deactivate)
  static async updateUserStatus(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

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

      user.isActive = isActive;
      await userRepository.save(user);

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: user.toPublicJSON()
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update user status' });
    }
  }

  // Get user details
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
        data: user.toPublicJSON()
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch user details' });
    }
  }

  // Create new admin (super admin only)
  static async createAdmin(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { email, password, fullName, role } = req.body;
      const adminRepository = AppDataSource.getRepository(Admin);

      // Check if admin already exists
      const existingAdmin = await adminRepository.findOne({ where: { email } });
      if (existingAdmin) {
        res.status(400).json({ success: false, message: 'Admin with this email already exists' });
        return;
      }

      const newAdmin = adminRepository.create({
        email,
        password,
        fullName,
        role: AdminRole.ADMIN
      });

      await adminRepository.save(newAdmin);

      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        data: newAdmin.toPublicJSON()
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create admin' });
    }
  }
} 