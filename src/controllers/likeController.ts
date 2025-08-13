import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Like } from '../models/Like';
import { Property } from '../models/Property';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';

interface UserRequest extends Request {
  user?: User;
}

export const likeController = {
  async likeProperty(req: UserRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error = new Error('User not authenticated') as AppError;
        error.statusCode = 401;
        return next(error);
      }

      const { propertyId } = req.params;
      const likeRepository = AppDataSource.getRepository(Like);
      const propertyRepository = AppDataSource.getRepository(Property);

      // Check if property exists
      const property = await propertyRepository.findOne({
        where: { id: propertyId, isActive: true }
      });

      if (!property) {
        const error = new Error('Property not found') as AppError;
        error.statusCode = 404;
        return next(error);
      }

      // Check if already liked
      const existingLike = await likeRepository.findOne({
        where: { userId: req.user.id, propertyId }
      });

      if (existingLike) {
        const error = new Error('Property already liked') as AppError;
        error.statusCode = 409;
        return next(error);
      }

      // Create new like
      const like = likeRepository.create({
        userId: req.user.id,
        propertyId
      });

      await likeRepository.save(like);

      res.status(201).json({
        success: true,
        message: 'Property liked successfully',
        data: like.toJSON()
      });
    } catch (error) {
      next(error);
    }
  },

  async unlikeProperty(req: UserRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error = new Error('User not authenticated') as AppError;
        error.statusCode = 401;
        return next(error);
      }

      const { propertyId } = req.params;
      const likeRepository = AppDataSource.getRepository(Like);

      // Find and delete the like
      const like = await likeRepository.findOne({
        where: { userId: req.user.id, propertyId }
      });

      if (!like) {
        const error = new Error('Property not liked') as AppError;
        error.statusCode = 404;
        return next(error);
      }

      await likeRepository.remove(like);

      res.json({
        success: true,
        message: 'Property unliked successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async getUserLikes(req: UserRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error = new Error('User not authenticated') as AppError;
        error.statusCode = 401;
        return next(error);
      }

      const { page = 1, limit = 20 } = req.query;
      const likeRepository = AppDataSource.getRepository(Like);

      const [likes, total] = await likeRepository.findAndCount({
        where: { userId: req.user.id },
        relations: ['property', 'property.category'],
        order: { createdAt: 'DESC' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      });

      const likedProperties = likes.map(like => ({
        ...like.property.toJSON(),
        likedAt: like.createdAt
      }));

      res.json({
        success: true,
        data: {
          properties: likedProperties,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async checkIfLiked(req: UserRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error = new Error('User not authenticated') as AppError;
        error.statusCode = 401;
        return next(error);
      }

      const { propertyId } = req.params;
      const likeRepository = AppDataSource.getRepository(Like);

      const like = await likeRepository.findOne({
        where: { userId: req.user.id, propertyId }
      });

      res.json({
        success: true,
        data: {
          isLiked: !!like,
          likeId: like?.id || null
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getPropertyLikeCount(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      const likeRepository = AppDataSource.getRepository(Like);

      const count = await likeRepository.count({
        where: { propertyId }
      });

      res.json({
        success: true,
        data: {
          likeCount: count
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getUserLikeCount(req: UserRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error = new Error('User not authenticated') as AppError;
        error.statusCode = 401;
        return next(error);
      }

      const likeRepository = AppDataSource.getRepository(Like);

      const count = await likeRepository.count({
        where: { userId: req.user.id }
      });

      res.json({
        success: true,
        data: {
          totalLikes: count
        }
      });
    } catch (error) {
      next(error);
    }
  }
}; 