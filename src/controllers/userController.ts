import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';

export const userController = {
  // Get user profile
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: req.user!.id }
      });

      if (!user) {
        const error = new Error('User not found') as AppError;
        error.statusCode = 404;
        return next(error);
      }

      res.json({
        success: true,
        data: {
          user: user.toPublicJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update user profile
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: req.user!.id }
      });

      if (!user) {
        const error = new Error('User not found') as AppError;
        error.statusCode = 404;
        return next(error);
      }

      // Update allowed fields
      const allowedFields = ['fullName', 'location', 'gender'];
      const updates: any = {};

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Check if email is being updated and if it's already taken
      if (req.body.email && req.body.email !== user.email) {
        const existingUser = await userRepository.findOne({
          where: { email: req.body.email }
        });

        if (existingUser) {
          const error = new Error('Email already taken') as AppError;
          error.statusCode = 409;
          return next(error);
        }
        updates.email = req.body.email;
      }

      // Check if phone number is being updated and if it's already taken
      if (req.body.phoneNumber && req.body.phoneNumber !== user.phoneNumber) {
        const existingUser = await userRepository.findOne({
          where: { phoneNumber: req.body.phoneNumber }
        });

        if (existingUser) {
          const error = new Error('Phone number already taken') as AppError;
          error.statusCode = 409;
          return next(error);
        }
        updates.phoneNumber = req.body.phoneNumber;
      }

      // Update password if provided
      if (req.body.password) {
        if (req.body.password.length < 6) {
          const error = new Error('Password must be at least 6 characters long') as AppError;
          error.statusCode = 400;
          return next(error);
        }
        updates.password = req.body.password;
      }

      await userRepository.update(req.user!.id, updates);

      // Get updated user
      const updatedUser = await userRepository.findOne({
        where: { id: req.user!.id }
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser!.toPublicJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete user profile
  async deleteProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: req.user!.id }
      });

      if (!user) {
        const error = new Error('User not found') as AppError;
        error.statusCode = 404;
        return next(error);
      }

      await userRepository.remove(user);

      res.json({
        success: true,
        message: 'Profile deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}; 