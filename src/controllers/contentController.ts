import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Category } from '../models/Category';
import { Property } from '../models/Property';
import { RoomType } from '../models/RoomType';
import { Like } from '../models/Like';
import { RegionalSection } from '../models/RegionalSection';
import { Like as TypeORMLike } from 'typeorm';
import { AppError } from '../middleware/errorHandler';
import cloudinary from '../config/cloudinary';
import fs from 'fs';
import { NotificationController } from './notificationController';
import { PushNotificationService } from '../services/pushNotificationService';
import { NotificationType } from '../models/Notification';
export const contentController = {
  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        const error = new Error('Category image is required') as AppError;
        error.statusCode = 400;
        return next(error);
      }
      const categoryRepository = AppDataSource.getRepository(Category);
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'hosfind/categories',
        transformation: [
          { width: 400, height: 300, crop: 'fill' },
          { quality: 'auto' }
        ]
      });
      fs.unlinkSync(req.file.path);
      const category = categoryRepository.create({
        name: req.body.name,
        description: req.body.description,
        imageUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
        type: req.body.type || 'hostel',
        displayOrder: parseInt(req.body.displayOrder) || 0
      });
      await categoryRepository.save(category);
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category.toJSON()
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  },
  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        const error = new Error('Category ID is required') as AppError;
        error.statusCode = 400;
        return next(error);
      }
      const categoryRepository = AppDataSource.getRepository(Category);
      const category = await categoryRepository.findOne({ where: { id } });
      if (!category) {
        const error = new Error('Category not found') as AppError;
        error.statusCode = 404;
        return next(error);
      }
      if (req.file) {
        if (category.cloudinaryPublicId) {
          await cloudinary.uploader.destroy(category.cloudinaryPublicId);
        }
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'hosfind/categories',
          transformation: [
            { width: 400, height: 300, crop: 'fill' },
            { quality: 'auto' }
          ]
        });
        fs.unlinkSync(req.file.path);
        category.imageUrl = result.secure_url;
        category.cloudinaryPublicId = result.public_id;
      }
      if (req.body.name) category.name = req.body.name;
      if (req.body.description !== undefined) category.description = req.body.description;
      if (req.body.type) category.type = req.body.type;
      if (req.body.displayOrder !== undefined) category.displayOrder = parseInt(req.body.displayOrder);
      if (req.body.isActive !== undefined) category.isActive = req.body.isActive;
      await categoryRepository.save(category);
      res.json({
        success: true,
        message: 'Category updated successfully',
        data: category.toJSON()
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  },
  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const categoryRepository = AppDataSource.getRepository(Category);
      const category = await categoryRepository.findOne({ where: { id } });
      if (!category) {
        const error = new Error('Category not found') as AppError;
        error.statusCode = 404;
        return next(error);
      }
      const propertyRepository = AppDataSource.getRepository(Property);
      const propertyCount = await propertyRepository.count({ where: { categoryId: id } });
      if (propertyCount > 0) {
        const error = new Error('Cannot delete category with existing properties') as AppError;
        error.statusCode = 400;
        return next(error);
      }
      if (category.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(category.cloudinaryPublicId);
      }
      await categoryRepository.remove(category);
      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },
  async getCategories(req: Request, res: Response, next: NextFunction) {
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
  },
  async getCategoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const categoryRepository = AppDataSource.getRepository(Category);
      const category = await categoryRepository.findOne({
        where: { id, isActive: true }
      });
      if (!category) {
        const error = new Error('Category not found') as AppError;
        error.statusCode = 404;
        return next(error);
      }
      res.json({
        success: true,
        data: category.toJSON()
      });
    } catch (error) {
      next(error);
    }
  },
  async createProperty(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.files || !req.files.length) {
        const error = new Error('Property images are required') as AppError;
        error.statusCode = 400;
        return next(error);
      }
      const propertyRepository = AppDataSource.getRepository(Property);
      const categoryRepository = AppDataSource.getRepository(Category);
      const category = await categoryRepository.findOne({ where: { id: req.body.categoryId } });
      if (!category) {
        const error = new Error('Invalid category') as AppError;
        error.statusCode = 400;
        return next(error);
      }
      const files = Array.isArray(req.files) ? req.files : [req.files];
      const imageUrls: string[] = [];
      const cloudinaryIds: string[] = [];
      for (const file of files as any[]) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'hosfind/properties',
          transformation: [
            { width: 800, height: 600, crop: 'fill' },
            { quality: 'auto' }
          ]
        });
        imageUrls.push(result.secure_url);
        cloudinaryIds.push(result.public_id);
        fs.unlinkSync((file as any).path);
      }
      const property = propertyRepository.create({
        name: req.body.name,
        description: req.body.description,
        mainImageUrl: imageUrls[0],
        mainImageCloudinaryId: cloudinaryIds[0],
        additionalImageUrls: imageUrls.slice(1),
        additionalImageCloudinaryIds: cloudinaryIds.slice(1),
        location: req.body.location,
        city: req.body.city,
        region: req.body.region,
        price: parseFloat(req.body.price),
        currency: req.body.currency || '₵',
        rating: parseFloat(req.body.rating) || 0,
        roomType: req.body.roomType,
        imageRoomTypes: req.body.imageRoomTypes ? JSON.parse(req.body.imageRoomTypes) : [],
        isFeatured: req.body.isFeatured === 'true',
        displayOrder: parseInt(req.body.displayOrder) || 0,
        categoryId: req.body.categoryId
      });
      await propertyRepository.save(property);
      category.propertyCount += 1;
      await categoryRepository.save(category);

      // Create notifications for all users about the new property
      try {
        await NotificationController.createNotificationForAllUsers(
          'New Property Available!',
          `${req.body.name} has been added to HosFind. Check it out now!`,
          NotificationType.NEW_PROPERTY,
          {
            propertyId: property.id,
            propertyName: req.body.name,
            propertyImage: property.mainImageUrl,
            city: req.body.city,
            region: req.body.region
          }
        );

        // Send push notifications to all users
        await PushNotificationService.sendNewPropertyNotification(
          req.body.name,
          property.id,
          property.mainImageUrl
        );

        console.log('✅ Notifications created and push notifications sent for new property');
      } catch (notificationError) {
        console.error('⚠️ Error creating notifications:', notificationError);
        // Don't fail the property creation if notifications fail
      }

      res.status(201).json({
        success: true,
        message: 'Property created successfully',
        data: property.toJSON()
      });
    } catch (error) {
      if (req.files) {
        const files = Array.isArray(req.files) ? req.files : [req.files];
        files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      next(error);
    }
  },
  async updateProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const propertyRepository = AppDataSource.getRepository(Property);
      const property = await propertyRepository.findOne({ where: { id } });
      if (!property) {
        const error = new Error('Property not found') as AppError;
        error.statusCode = 404;
        return next(error);
      }
      if (req.files && (req.files as any[]).length > 0) {
        const files = Array.isArray(req.files) ? req.files : [req.files];
        if (property.mainImageCloudinaryId) {
          await cloudinary.uploader.destroy(property.mainImageCloudinaryId);
        }
        if (property.additionalImageCloudinaryIds) {
          for (const cloudinaryId of property.additionalImageCloudinaryIds) {
            await cloudinary.uploader.destroy(cloudinaryId);
          }
        }
        const imageUrls: string[] = [];
        const cloudinaryIds: string[] = [];
        for (const file of files as any[]) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'hosfind/properties',
            transformation: [
              { width: 800, height: 600, crop: 'fill' },
              { quality: 'auto' }
            ]
          });
          imageUrls.push(result.secure_url);
          cloudinaryIds.push(result.public_id);
          fs.unlinkSync(file.path);
        }
        property.mainImageUrl = imageUrls[0];
        property.mainImageCloudinaryId = cloudinaryIds[0];
        property.additionalImageUrls = imageUrls.slice(1);
        property.additionalImageCloudinaryIds = cloudinaryIds.slice(1);
      }
      if (req.body.name) property.name = req.body.name;
      if (req.body.description) property.description = req.body.description;
      if (req.body.location) property.location = req.body.location;
      if (req.body.city) property.city = req.body.city;
      if (req.body.region) property.region = req.body.region;
      if (req.body.price) property.price = parseFloat(req.body.price);
      if (req.body.currency) property.currency = req.body.currency;
      if (req.body.rating) property.rating = parseFloat(req.body.rating);
      if (req.body.roomType) property.roomType = req.body.roomType;
      if (req.body.imageRoomTypes) property.imageRoomTypes = JSON.parse(req.body.imageRoomTypes);
      if (req.body.status) property.status = req.body.status;
      if (req.body.isFeatured !== undefined) property.isFeatured = req.body.isFeatured === 'true';
      if (req.body.isActive !== undefined) property.isActive = req.body.isActive;
      if (req.body.displayOrder !== undefined) property.displayOrder = parseInt(req.body.displayOrder);
      await propertyRepository.save(property);
      res.json({
        success: true,
        message: 'Property updated successfully',
        data: property.toJSON()
      });
    } catch (error) {
      if (req.files) {
        const files = Array.isArray(req.files) ? req.files : [req.files];
        files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      next(error);
    }
  },
  async deleteProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const propertyRepository = AppDataSource.getRepository(Property);
      const property = await propertyRepository.findOne({ where: { id } });
      if (!property) {
        const error = new Error('Property not found') as AppError;
        error.statusCode = 404;
        return next(error);
      }
      if (property.mainImageCloudinaryId) {
        await cloudinary.uploader.destroy(property.mainImageCloudinaryId);
      }
      if (property.additionalImageCloudinaryIds) {
        for (const cloudinaryId of property.additionalImageCloudinaryIds) {
          await cloudinary.uploader.destroy(cloudinaryId);
        }
      }
      if (property.categoryId) {
        const categoryRepository = AppDataSource.getRepository(Category);
        const category = await categoryRepository.findOne({ where: { id: property.categoryId } });
        if (category && category.propertyCount > 0) {
          category.propertyCount -= 1;
          await categoryRepository.save(category);
        }
      }
      await propertyRepository.remove(property);
      res.json({
        success: true,
        message: 'Property deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },
  async getProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const propertyRepository = AppDataSource.getRepository(Property);
      const properties = await propertyRepository.find({
        where: { isActive: true },
        relations: ['category', 'roomTypes'],
        order: { displayOrder: 'ASC', createdAt: 'DESC' }
      });
      res.json({
        success: true,
        data: properties.map(prop => prop.toJSON())
      });
    } catch (error) {
      next(error);
    }
  },
  async getFeaturedProperties(req: Request, res: Response, next: NextFunction) {
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
  },
  async getPropertiesByRegion(req: Request, res: Response, next: NextFunction) {
    try {
      const { region } = req.params;
      const propertyRepository = AppDataSource.getRepository(Property);
      const properties = await propertyRepository.find({
        where: { isActive: true, region },
        relations: ['category'],
        order: { displayOrder: 'ASC', rating: 'DESC' }
      });
      res.json({
        success: true,
        data: properties.map(prop => prop.toJSON())
      });
    } catch (error) {
      next(error);
    }
  },
  async getPropertiesByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.params;
      const { page = 1, limit = 20, sortBy = 'rating', sortOrder = 'DESC' } = req.query;
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
  },
  async searchProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        q = '', 
        categoryId = '', 
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
  },
  async getPropertyById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const propertyRepository = AppDataSource.getRepository(Property);
      const roomTypeRepository = AppDataSource.getRepository(RoomType);
      const likeRepository = AppDataSource.getRepository(Like);
      
      const property = await propertyRepository.findOne({
        where: { id, isActive: true },
        relations: ['category']
      });
      
      if (!property) {
        const error = new Error('Property not found') as AppError;
        error.statusCode = 404;
        return next(error);
      }

      // Load room types separately
      const roomTypes = await roomTypeRepository.find({
        where: { propertyId: id, isActive: true },
        order: { displayOrder: 'ASC', price: 'ASC' }
      });

      // Get like count
      const likeCount = await likeRepository.count({
        where: { propertyId: id }
      });

      const propertyData = property.toJSON() as any;
      const serializedRoomTypes = roomTypes.map(rt => rt.toJSON());
      propertyData.roomTypes = serializedRoomTypes;
      propertyData.roomTypeGroups = serializedRoomTypes.reduce((groups, roomType) => {
        const key = (roomType.name || '').trim().toLowerCase() || roomType.id;
        const existing = groups.find(group => group.key === key);
        if (existing) {
          existing.variants.push(roomType);
        } else {
          groups.push({
            key,
            name: roomType.name,
            variants: [roomType]
          });
        }
        return groups;
      }, [] as Array<{ key: string; name: string; variants: any[] }>);
      propertyData.likeCount = likeCount;

      res.json({
        success: true,
        data: propertyData
      });
    } catch (error) {
      next(error);
    }
  },
  async getPropertiesByType(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const propertyRepository = AppDataSource.getRepository(Property);
      const categoryRepository = AppDataSource.getRepository(Category);
      
      // Find category by name (case-insensitive)
      const category = await categoryRepository.findOne({
        where: { name: TypeORMLike(`%${type}%`) }
      });
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      
      const [properties, total] = await propertyRepository.findAndCount({
        where: { categoryId: category.id, isActive: true },
        relations: ['category', 'roomTypes'],
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
  },

  // Room Type Management
  async createRoomType(req: Request, res: Response, next: NextFunction) {
    try {
      const roomTypeRepository = AppDataSource.getRepository(RoomType);
      const propertyRepository = AppDataSource.getRepository(Property);
      
      const property = await propertyRepository.findOne({ where: { id: req.body.propertyId } });
      if (!property) {
        const error = new Error('Property not found') as AppError;
        error.statusCode = 404;
        return next(error);
      }

      const roomType = roomTypeRepository.create({
        name: req.body.name,
        description: req.body.description,
        price: parseFloat(req.body.price),
        currency: req.body.currency || '₵',
        genderType: req.body.genderType || 'any',
        capacity: parseInt(req.body.capacity) || 1,
        roomTypeCategory: req.body.roomTypeCategory,
        isAvailable: req.body.isAvailable !== 'false',
        availableRooms: parseInt(req.body.availableRooms) || 0,
        totalRooms: parseInt(req.body.totalRooms) || 0,
        amenities: req.body.amenities ? JSON.parse(req.body.amenities) : [],
        imageUrl: req.body.imageUrl,
        propertyId: req.body.propertyId,
        displayOrder: parseInt(req.body.displayOrder) || 0
      });

      await roomTypeRepository.save(roomType);
      res.status(201).json({
        success: true,
        message: 'Room type created successfully',
        data: roomType.toJSON()
      });
    } catch (error) {
      next(error);
    }
  },

  async updateRoomType(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const roomTypeRepository = AppDataSource.getRepository(RoomType);
      const roomType = await roomTypeRepository.findOne({ where: { id } });
      
      if (!roomType) {
        const error = new Error('Room type not found') as AppError;
        error.statusCode = 404;
        return next(error);
      }

      if (req.body.name) roomType.name = req.body.name;
      if (req.body.description !== undefined) roomType.description = req.body.description;
      if (req.body.price) roomType.price = parseFloat(req.body.price);
      if (req.body.currency) roomType.currency = req.body.currency;
      if (req.body.genderType) roomType.genderType = req.body.genderType;
      if (req.body.capacity) roomType.capacity = parseInt(req.body.capacity);
      if (req.body.roomTypeCategory) roomType.roomTypeCategory = req.body.roomTypeCategory;
      if (req.body.isAvailable !== undefined) roomType.isAvailable = req.body.isAvailable === 'true';
      if (req.body.availableRooms !== undefined) roomType.availableRooms = parseInt(req.body.availableRooms);
      if (req.body.totalRooms !== undefined) roomType.totalRooms = parseInt(req.body.totalRooms);
      if (req.body.amenities) roomType.amenities = JSON.parse(req.body.amenities);
      if (req.body.imageUrl) roomType.imageUrl = req.body.imageUrl;
      if (req.body.displayOrder !== undefined) roomType.displayOrder = parseInt(req.body.displayOrder);
      if (req.body.isActive !== undefined) roomType.isActive = req.body.isActive === 'true';

      await roomTypeRepository.save(roomType);
      res.json({
        success: true,
        message: 'Room type updated successfully',
        data: roomType.toJSON()
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteRoomType(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const roomTypeRepository = AppDataSource.getRepository(RoomType);
      const roomType = await roomTypeRepository.findOne({ where: { id } });
      
      if (!roomType) {
        const error = new Error('Room type not found') as AppError;
        error.statusCode = 404;
        return next(error);
      }

      await roomTypeRepository.remove(roomType);
      res.json({
        success: true,
        message: 'Room type deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async getRoomTypesByProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      const roomTypeRepository = AppDataSource.getRepository(RoomType);
      const roomTypes = await roomTypeRepository.find({
        where: { propertyId, isActive: true },
        order: { displayOrder: 'ASC', price: 'ASC' }
      });
      res.json({
        success: true,
        data: roomTypes.map(rt => rt.toJSON())
      });
    } catch (error) {
      next(error);
    }
  },

  async getRoomTypeById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const roomTypeRepository = AppDataSource.getRepository(RoomType);
      const propertyRepository = AppDataSource.getRepository(Property);
      
      const roomType = await roomTypeRepository.findOne({
        where: { id, isActive: true }
      });
      
      if (!roomType) {
        const error = new Error('Room type not found') as AppError;
        error.statusCode = 404;
        return next(error);
      }

      const property = await propertyRepository.findOne({
        where: { id: roomType.propertyId, isActive: true }
      });

      const normalizedName = (roomType.name || '').trim();
      const groupQuery = roomTypeRepository
        .createQueryBuilder('roomType')
        .where('roomType.propertyId = :propertyId', { propertyId: roomType.propertyId })
        .andWhere('roomType.isActive = :isActive', { isActive: true });

      if (normalizedName.length > 0) {
        groupQuery.andWhere('LOWER(roomType.name) = LOWER(:name)', { name: normalizedName });
      } else {
        groupQuery.andWhere('roomType.id = :roomTypeId', { roomTypeId: roomType.id });
      }

      const groupedRoomTypes = await groupQuery
        .orderBy('roomType.displayOrder', 'ASC')
        .addOrderBy('roomType.price', 'ASC')
        .getMany();

      const roomTypeData = roomType.toJSON();
      
      // Create response object with property information
      const responseData = {
        ...roomTypeData,
        property: property ? {
          id: property.id,
          name: property.name,
          location: property.location,
          city: property.city
        } : null,
        roomTypeGroup: {
          name: roomType.name,
          variants: groupedRoomTypes.map(rt => rt.toJSON())
        }
      };

      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      next(error);
    }
  },

  async getRegionalSections(req: Request, res: Response, next: NextFunction) {
    try {
      const regionalSectionRepository = AppDataSource.getRepository(RegionalSection);
      const propertyRepository = AppDataSource.getRepository(Property);
      
      // Get all active regional sections
      const regionalSections = await regionalSectionRepository.find({
        where: { isActive: true },
        order: { displayOrder: 'ASC', createdAt: 'DESC' }
      });

      // For each regional section, get the properties
      const sectionsWithProperties = await Promise.all(
        regionalSections.map(async (section) => {
          const properties = await propertyRepository.find({
            where: { 
              regionalSectionId: section.id,
              isActive: true 
            },
            order: { createdAt: 'DESC' },
            take: 10 // Limit to 10 properties per section
          });

          return {
            id: section.id,
            name: section.name,
            propertyCount: section.propertyCount,
            properties: properties.map(property => ({
              id: property.id,
              name: property.name,
              description: property.description,
              mainImageUrl: property.mainImageUrl,
              location: property.location,
              city: property.city,
              region: property.region,
              price: property.price,
              currency: property.currency,
              rating: property.rating,
              reviewCount: property.reviewCount,
              category: property.category ? {
                id: property.category.id,
                name: property.category.name,
                icon: property.category.icon,
                color: property.category.color
              } : null
            }))
          };
        })
      );

      res.json({
        success: true,
        data: sectionsWithProperties
      });
    } catch (error) {
      next(error);
    }
  }
}; 