import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Property } from '../models/Property';
import { Category } from '../models/Category';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
interface UserRequest extends Request {
  user?: User;
}
export class UserController {
  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categoryRepository = AppDataSource.getRepository(Category);
      const categories = await categoryRepository.find({
        where: { isActive: true },
        order: { displayOrder: 'ASC', createdAt: 'DESC' }
      });
      res.json({
        success: true,
        data: categories.map(cat => cat.toJSON())
      });
    } catch (error) {
      next(error);
    }
  }
  static async getProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const propertyRepository = AppDataSource.getRepository(Property);
      const [properties, total] = await propertyRepository.findAndCount({
        where: { isActive: true },
        relations: ['category'],
        order: { displayOrder: 'ASC', createdAt: 'DESC' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      });
      res.json({
        success: true,
        data: {
          properties: properties.map(prop => prop.toJSON()),
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
  }
  static async getFeaturedProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const propertyRepository = AppDataSource.getRepository(Property);
      const properties = await propertyRepository.find({
        where: { isActive: true, isFeatured: true },
        relations: ['category'],
        order: { displayOrder: 'ASC', rating: 'DESC' },
        take: 10
      });
      res.json({
        success: true,
        data: properties.map(prop => prop.toJSON())
      });
    } catch (error) {
      next(error);
    }
  }
  static async getPropertiesByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.params;
      const { page = 1, limit = 20, sortBy = 'rating', sortOrder = 'DESC' } = req.query;
      if (!categoryId) {
        const error = new Error('Category ID is required') as AppError;
        error.statusCode = 400;
        return next(error);
      }
      const propertyRepository = AppDataSource.getRepository(Property);
      const queryBuilder = propertyRepository.createQueryBuilder('property')
        .leftJoinAndSelect('property.category', 'category')
        .where('property.categoryId = :categoryId', { categoryId })
        .andWhere('property.isActive = :isActive', { isActive: true });
      if (sortBy === 'price') {
        queryBuilder.orderBy('property.price', sortOrder === 'ASC' ? 'ASC' : 'DESC');
      } else if (sortBy === 'rating') {
        queryBuilder.orderBy('property.rating', sortOrder === 'ASC' ? 'ASC' : 'DESC');
      } else if (sortBy === 'newest') {
        queryBuilder.orderBy('property.createdAt', 'DESC');
      } else {
        queryBuilder.orderBy('property.displayOrder', 'ASC');
      }
      const [properties, total] = await queryBuilder
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit))
        .getManyAndCount();
      res.json({
        success: true,
        data: {
          properties: properties.map(prop => prop.toJSON()),
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
  }
  static async searchProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        q = '', 
        categoryId = '', 
        propertyType = '', 
        minPrice = '', 
        maxPrice = '', 
        minRating = '',
        region = '',
        city = '',
        page = 1, 
        limit = 20 
      } = req.query;
      const propertyRepository = AppDataSource.getRepository(Property);
      const queryBuilder = propertyRepository.createQueryBuilder('property')
        .leftJoinAndSelect('property.category', 'category')
        .where('property.isActive = :isActive', { isActive: true });
      if (q) {
        queryBuilder.andWhere(
          '(property.name ILIKE :search OR property.description ILIKE :search OR property.location ILIKE :search)',
          { search: `%${q}%` }
        );
      }
      if (categoryId) {
        queryBuilder.andWhere('property.categoryId = :categoryId', { categoryId });
      }
      if (propertyType) {
        queryBuilder.andWhere('property.propertyType = :propertyType', { propertyType });
      }
      if (minPrice) {
        queryBuilder.andWhere('property.price >= :minPrice', { minPrice: parseFloat(minPrice as string) });
      }
      if (maxPrice) {
        queryBuilder.andWhere('property.price <= :maxPrice', { maxPrice: parseFloat(maxPrice as string) });
      }
      if (minRating) {
        queryBuilder.andWhere('property.rating >= :minRating', { minRating: parseFloat(minRating as string) });
      }
      if (region) {
        queryBuilder.andWhere('property.region ILIKE :region', { region: `%${region}%` });
      }
      if (city) {
        queryBuilder.andWhere('property.city ILIKE :city', { city: `%${city}%` });
      }
      const [properties, total] = await queryBuilder
        .orderBy('property.rating', 'DESC')
        .addOrderBy('property.displayOrder', 'ASC')
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit))
        .getManyAndCount();
      res.json({
        success: true,
        data: {
          properties: properties.map(prop => prop.toJSON()),
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
  }
  static async getPropertyById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        const error = new Error('Property ID is required') as AppError;
        error.statusCode = 400;
        return next(error);
      }
      const propertyRepository = AppDataSource.getRepository(Property);
      const property = await propertyRepository.findOne({
        where: { id, isActive: true },
        relations: ['category']
      });
      if (!property) {
        const error = new Error('Property not found') as AppError;
        error.statusCode = 404;
        return next(error);
      }
      res.json({
        success: true,
        data: property.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }
  static async getPropertiesByType(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.params;
      const { page = 1, limit = 20 } = req.query;
      if (!type) {
        const error = new Error('Property type is required') as AppError;
        error.statusCode = 400;
        return next(error);
      }
      const propertyRepository = AppDataSource.getRepository(Property);
      const [properties, total] = await propertyRepository.findAndCount({
        where: { propertyType: type as any, isActive: true },
        relations: ['category'],
        order: { rating: 'DESC', displayOrder: 'ASC' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      });
      res.json({
        success: true,
        data: {
          properties: properties.map(prop => prop.toJSON()),
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
  }
  static async getPropertiesByRegion(req: Request, res: Response, next: NextFunction) {
    try {
      const { region } = req.params;
      const { page = 1, limit = 20 } = req.query;
      if (!region) {
        const error = new Error('Region is required') as AppError;
        error.statusCode = 400;
        return next(error);
      }
      const propertyRepository = AppDataSource.getRepository(Property);
      const [properties, total] = await propertyRepository.findAndCount({
        where: { isActive: true, region },
        relations: ['category'],
        order: { displayOrder: 'ASC', rating: 'DESC' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      });
      res.json({
        success: true,
        data: {
          properties: properties.map(prop => prop.toJSON()),
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
  }
  static async getProfile(req: UserRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error = new Error('User not authenticated') as AppError;
        error.statusCode = 401;
        return next(error);
      }
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: req.user.id }
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
  }
  static async updateProfile(req: UserRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error = new Error('User not authenticated') as AppError;
        error.statusCode = 401;
        return next(error);
      }
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: req.user.id }
      });
      if (!user) {
        const error = new Error('User not found') as AppError;
        error.statusCode = 404;
        return next(error);
      }
      const allowedFields = ['fullName', 'location', 'gender'];
      const updates: any = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
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
      if (req.body.password) {
        if (req.body.password.length < 6) {
          const error = new Error('Password must be at least 6 characters long') as AppError;
          error.statusCode = 400;
          return next(error);
        }
        updates.password = req.body.password;
      }
      await userRepository.update(req.user.id, updates);
      const updatedUser = await userRepository.findOne({
        where: { id: req.user.id }
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
  }
  static async deleteProfile(req: UserRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error = new Error('User not authenticated') as AppError;
        error.statusCode = 401;
        return next(error);
      }
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: req.user.id }
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
} 