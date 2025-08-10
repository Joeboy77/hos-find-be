import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Admin, AdminRole } from '../models/Admin';
import { Property, PropertyType, PropertyStatus } from '../models/Property';
import { Category } from '../models/Category';
import { AppError } from '../middleware/errorHandler';
interface AdminRequest extends Request {
  admin?: Admin;
}
export class AdminController {
  static async login(req: Request, res: Response, next: NextFunction) {
    console.log('🔑 [ADMIN LOGIN] Starting admin login process');
    console.log('🔑 [ADMIN LOGIN] Request body:', req.body);
    console.log('🔑 [ADMIN LOGIN] Request headers:', req.headers);
    try {
      const { email, password } = req.body;
      console.log('🔑 [ADMIN LOGIN] Extracted email:', email);
      console.log('🔑 [ADMIN LOGIN] Password provided:', password ? 'YES' : 'NO');
      if (!email || !password) {
        console.log('❌ [ADMIN LOGIN] Missing email or password');
        const error = new Error('Email and password are required') as AppError;
        error.statusCode = 400;
        return next(error);
      }
      console.log('🔑 [ADMIN LOGIN] Looking up admin in database...');
      console.log('🔑 [ADMIN LOGIN] Database connection status:', AppDataSource.isInitialized ? 'CONNECTED' : 'NOT CONNECTED');
      const adminRepository = AppDataSource.getRepository(Admin);
      const admin = await adminRepository.findOne({ where: { email } });
      console.log('🔑 [ADMIN LOGIN] Admin lookup result:', admin ? `Found admin ID: ${admin.id}` : 'Admin not found');
      console.log('🔑 [ADMIN LOGIN] Admin details if found:', admin ? {
        id: admin.id,
        email: admin.email,
        isActive: admin.isActive,
        hasPassword: !!admin.password,
        passwordLength: admin.password ? admin.password.length : 0
      } : 'N/A');
      if (!admin || !admin.isActive) {
        console.log('❌ [ADMIN LOGIN] Admin not found or inactive');
        const error = new Error('Invalid credentials or admin account inactive') as AppError;
        error.statusCode = 401;
        return next(error);
      }
      console.log('🔑 [ADMIN LOGIN] Validating password...');
      const isValidPassword = await admin.validatePassword(password);
      console.log('🔑 [ADMIN LOGIN] Password validation result:', isValidPassword);
      if (!isValidPassword) {
        console.log('❌ [ADMIN LOGIN] Invalid password');
        const error = new Error('Invalid credentials') as AppError;
        error.statusCode = 401;
        return next(error);
      }
      console.log('🔑 [ADMIN LOGIN] Password valid, generating tokens...');
      const accessToken = jwt.sign(
        {
          id: admin.id,
          email: admin.email,
          role: admin.role,
          type: 'admin'
        },
        process.env.JWT_SECRET!,
        { expiresIn: '90d' }
      );
      const refreshToken = jwt.sign(
        {
          id: admin.id,
          type: 'admin_refresh'
        },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '180d' }
      );
      console.log('🔑 [ADMIN LOGIN] Tokens generated, updating admin record...');
      await adminRepository.update(admin.id, {
        refreshToken,
        lastLoginAt: new Date()
      });
      console.log('✅ [ADMIN LOGIN] Admin login successful, sending response');
      res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          admin: admin.toPublicJSON(),
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
  static async getDashboardStats(req: AdminRequest, res: Response) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const adminRepository = AppDataSource.getRepository(Admin);
      const propertyRepository = AppDataSource.getRepository(Property);
      const categoryRepository = AppDataSource.getRepository(Category);
      const totalUsers = await userRepository.count();
      const totalAdmins = await adminRepository.count();
      const activeUsers = await userRepository.count({ where: { isActive: true } });
      const totalProperties = await propertyRepository.count();
      const activeProperties = await propertyRepository.count({ where: { isActive: true } });
      const featuredProperties = await propertyRepository.count({ where: { isFeatured: true, isActive: true } });
      const totalCategories = await categoryRepository.count();
      res.json({
        success: true,
        data: {
          totalUsers,
          totalAdmins,
          activeUsers,
          totalProperties,
          activeProperties,
          featuredProperties,
          totalCategories,
          systemStatus: 'healthy'
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
    }
  }
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
  static async createAdmin(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { email, password, fullName, role } = req.body;
      const adminRepository = AppDataSource.getRepository(Admin);
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
  static async getAllProperties(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        categoryId = '', 
        propertyType = '', 
        status = '',
        isFeatured = ''
      } = req.query;
      const propertyRepository = AppDataSource.getRepository(Property);
      const queryBuilder = propertyRepository.createQueryBuilder('property')
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
      if (propertyType) {
        queryBuilder.andWhere('property.propertyType = :propertyType', { propertyType });
      }
      if (status) {
        queryBuilder.andWhere('property.status = :status', { status });
      }
      if (isFeatured !== '') {
        queryBuilder.andWhere('property.isFeatured = :isFeatured', { isFeatured: isFeatured === 'true' });
      }
      const [properties, total] = await queryBuilder
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit))
        .orderBy('property.createdAt', 'DESC')
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
      const property = await propertyRepository.findOne({
        where: { id },
        relations: ['category']
      });
      if (!property) {
        res.status(404).json({ success: false, message: 'Property not found' });
        return;
      }
      res.json({
        success: true,
        data: property.toJSON()
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch property details' });
    }
  }
  static async updatePropertyStatus(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, isActive, isFeatured } = req.body;
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
      if (status !== undefined) property.status = status;
      if (isActive !== undefined) property.isActive = isActive;
      if (isFeatured !== undefined) property.isFeatured = isFeatured;
      await propertyRepository.save(property);
      res.json({
        success: true,
        message: 'Property status updated successfully',
        data: property.toJSON()
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update property status' });
    }
  }
  static async updatePropertyRating(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { rating, reviewCount } = req.body;
      if (!id) {
        res.status(400).json({ success: false, message: 'Property ID is required' });
        return;
      }
      if (rating < 0 || rating > 5) {
        res.status(400).json({ success: false, message: 'Rating must be between 0 and 5' });
        return;
      }
      const propertyRepository = AppDataSource.getRepository(Property);
      const property = await propertyRepository.findOne({ where: { id } });
      if (!property) {
        res.status(404).json({ success: false, message: 'Property not found' });
        return;
      }
      property.rating = rating;
      if (reviewCount !== undefined) property.reviewCount = reviewCount;
      await propertyRepository.save(property);
      res.json({
        success: true,
        message: 'Property rating updated successfully',
        data: property.toJSON()
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update property rating' });
    }
  }
  static async getAllCategories(req: AdminRequest, res: Response): Promise<void> {
    try {
      const categoryRepository = AppDataSource.getRepository(Category);
      const categories = await categoryRepository.find({
        order: { displayOrder: 'ASC', createdAt: 'DESC' }
      });
      res.json({
        success: true,
        data: categories.map(cat => cat.toJSON())
      });
    } catch (error) {
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
      const category = await categoryRepository.findOne({
        where: { id },
        relations: ['properties']
      });
      if (!category) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }
      res.json({
        success: true,
        data: category.toJSON()
      });
    } catch (error) {
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
      const { name, description, imageUrl, type = 'hostel', displayOrder = 0 } = req.body;
      if (!name || !description || !imageUrl) {
        res.status(400).json({ 
          success: false, 
          message: 'Category name, description, and imageUrl are required' 
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
        description,
        imageUrl,
        type,
        displayOrder,
        isActive: true,
        propertyCount: 0
      });
      await categoryRepository.save(newCategory);
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
      const updateData = req.body;
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
      if (updateData.name && updateData.name !== category.name) {
        const existingCategory = await categoryRepository.findOne({ 
          where: { name: updateData.name.toLowerCase() } 
        });
        if (existingCategory) {
          res.status(400).json({ 
            success: false, 
            message: 'Category with this name already exists' 
          });
          return;
        }
        updateData.name = updateData.name.toLowerCase();
      }
      const allowedFields = ['name', 'description', 'imageUrl', 'type', 'displayOrder', 'isActive'];
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          (category as any)[field] = updateData[field];
        }
      });
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
      const activePropertiesCount = await propertyRepository.count({
        where: { categoryId: id, isActive: true }
      });
      if (activePropertiesCount > 0) {
        res.status(400).json({ 
          success: false, 
          message: `Cannot delete category with ${activePropertiesCount} active properties. Please move or deactivate properties first.` 
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
  static async getCategoryStats(req: AdminRequest, res: Response): Promise<void> {
    try {
      const categoryRepository = AppDataSource.getRepository(Category);
      const propertyRepository = AppDataSource.getRepository(Property);
      const categories = await categoryRepository.find({
        order: { displayOrder: 'ASC' }
      });
      const categoryStats = await Promise.all(
        categories.map(async (category) => {
          const totalProperties = await propertyRepository.count({
            where: { categoryId: category.id }
          });
          const activeProperties = await propertyRepository.count({
            where: { categoryId: category.id, isActive: true }
          });
          const featuredProperties = await propertyRepository.count({
            where: { categoryId: category.id, isFeatured: true, isActive: true }
          });
          return {
            ...category.toJSON(),
            stats: {
              totalProperties,
              activeProperties,
              featuredProperties
            }
          };
        })
      );
      res.json({
        success: true,
        data: categoryStats
      });
    } catch (error) {
      console.error('Error fetching category stats:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch category statistics' });
    }
  }
  static async createProperty(req: AdminRequest, res: Response): Promise<void> {
    try {
      const {
        name,
        description,
        mainImageUrl,
        additionalImageUrls = [],
        location,
        city,
        region,
        price,
        currency = '₵',
        propertyType,
        categoryId,
        isFeatured = false,
        displayOrder = 0
      } = req.body;
      if (!name || !description || !mainImageUrl || !location || !city || !region || !price || !propertyType || !categoryId) {
        res.status(400).json({ 
          success: false, 
          message: 'Missing required fields: name, description, mainImageUrl, location, city, region, price, propertyType, categoryId' 
        });
        return;
      }
      if (price <= 0) {
        res.status(400).json({ success: false, message: 'Price must be greater than 0' });
        return;
      }
      const validPropertyTypes = Object.values(PropertyType);
      if (!validPropertyTypes.includes(propertyType)) {
        res.status(400).json({ 
          success: false, 
          message: `Invalid property type. Must be one of: ${validPropertyTypes.join(', ')}` 
        });
        return;
      }
      const categoryRepository = AppDataSource.getRepository(Category);
      const category = await categoryRepository.findOne({ where: { id: categoryId } });
      if (!category) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }
      if (!category.isActive) {
        res.status(400).json({ success: false, message: 'Cannot add property to inactive category' });
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
      if (updateData.price !== undefined && updateData.price <= 0) {
        res.status(400).json({ success: false, message: 'Price must be greater than 0' });
        return;
      }
      if (updateData.propertyType !== undefined) {
        const validPropertyTypes = Object.values(PropertyType);
        if (!validPropertyTypes.includes(updateData.propertyType)) {
          res.status(400).json({ 
            success: false, 
            message: `Invalid property type. Must be one of: ${validPropertyTypes.join(', ')}` 
          });
          return;
        }
      }
      if (updateData.categoryId !== undefined) {
        const categoryRepository = AppDataSource.getRepository(Category);
        const category = await categoryRepository.findOne({ where: { id: updateData.categoryId } });
        if (!category) {
          res.status(404).json({ success: false, message: 'Category not found' });
          return;
        }
        if (!category.isActive) {
          res.status(400).json({ success: false, message: 'Cannot move property to inactive category' });
          return;
        }
      }
      const allowedFields = [
        'name', 'description', 'mainImageUrl', 'additionalImageUrls',
        'location', 'city', 'region', 'price', 'currency', 'propertyType',
        'categoryId', 'isFeatured', 'displayOrder', 'status', 'isActive'
      ];
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          (property as any)[field] = updateData[field];
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
  static async bulkUpdatePropertyStatuses(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { propertyIds, status, isActive, isFeatured } = req.body;
      if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
        res.status(400).json({ success: false, message: 'Property IDs array is required' });
        return;
      }
      const propertyRepository = AppDataSource.getRepository(Property);
      const updateData: any = {};
      if (status !== undefined) updateData.status = status;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
      if (Object.keys(updateData).length === 0) {
        res.status(400).json({ success: false, message: 'No update data provided' });
        return;
      }
      await propertyRepository.update(propertyIds, updateData);
      res.json({
        success: true,
        message: `Successfully updated ${propertyIds.length} properties`
      });
    } catch (error) {
      console.error('Error bulk updating properties:', error);
      res.status(500).json({ success: false, message: 'Failed to bulk update properties' });
    }
  }
} 