import { Router, Request, Response, NextFunction } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticateAdmin, requireAdminRole } from '../middleware/adminAuth';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
const router = Router();
const logRequest = (req: Request, res: Response, next: NextFunction): void => {
  console.log('🚀 [ROUTE] Request to:', req.method, req.originalUrl);
  console.log('🚀 [ROUTE] Path:', req.path);
  console.log('🚀 [ROUTE] Base URL:', req.baseUrl);
  console.log('🚀 [ROUTE] Full URL:', req.url);
  console.log('🚀 [ROUTE] Request body:', req.body);
  console.log('🚀 [ROUTE] Request headers:', req.headers);
  next();
};
console.log('🔧 [ROUTER SETUP] Setting up PUBLIC login route...');
router.post('/login', (req: Request, res: Response) => {
  console.log('🔑 [LOGIN] Login route hit, calling AdminController.login');
  AdminController.login(req, res, () => {});
});
router.post('/test', logRequest, (req: Request, res: Response) => {
  console.log('🧪 [ADMIN TEST] Test route hit');
  console.log('🧪 [ADMIN TEST] Request body:', req.body);
  res.json({ message: 'Admin test route working', body: req.body });
});
router.get('/dashboard', logRequest, authenticateAdmin, AdminController.getDashboardStats);
router.get('/users', logRequest, authenticateAdmin, requireAdminRole(), AdminController.getAllUsers);
router.get('/users/:userId', logRequest, authenticateAdmin, requireAdminRole(), AdminController.getUserDetails);
router.patch('/users/:userId/status', logRequest, authenticateAdmin, requireAdminRole(), AdminController.updateUserStatus);
router.post('/admins', 
  logRequest,
  authenticateAdmin,
  requireAdminRole(),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').trim().isLength({ min: 2 })
  ],
  validateRequest,
  AdminController.createAdmin
);
router.get('/properties', logRequest, authenticateAdmin, requireAdminRole(), AdminController.getAllProperties);
router.get('/properties/:id', logRequest, authenticateAdmin, requireAdminRole(), AdminController.getPropertyDetails);
router.post('/properties', 
  logRequest,
  authenticateAdmin,
  requireAdminRole(),
  [
    body('name').trim().isLength({ min: 3, max: 200 }).withMessage('Property name must be between 3 and 200 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Property description must be at least 10 characters'),
    body('mainImageUrl').isURL().withMessage('Main image must be a valid URL'),
    body('location').trim().isLength({ min: 5, max: 200 }).withMessage('Location must be between 5 and 200 characters'),
    body('city').trim().isLength({ min: 2, max: 100 }).withMessage('City must be between 2 and 100 characters'),
    body('region').trim().isLength({ min: 2, max: 100 }).withMessage('Region must be between 5 and 200 characters'),
    body('price').isFloat({ min: 0.01 }).withMessage('Price must be a positive number'),
    body('propertyType').isIn(['hostel', 'hotel', 'homestay', 'apartment', 'guesthouse']).withMessage('Invalid property type'),
    body('roomType').optional().isLength({ max: 100 }).withMessage('Room type must be 100 characters or less'),
    body('imageRoomTypes').optional().isArray().withMessage('Image room types must be an array'),
    body('categoryId').isUUID().withMessage('Category ID must be a valid UUID'),
    body('currency').optional().isLength({ max: 10 }).withMessage('Currency must be 10 characters or less'),
    body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),
    body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a non-negative integer')
  ],
  validateRequest,
  AdminController.createProperty
);
router.put('/properties/:id', 
  logRequest,
  authenticateAdmin,
  requireAdminRole(),
  [
    body('name').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Property name must be between 3 and 200 characters'),
    body('description').optional().trim().isLength({ min: 10 }).withMessage('Property description must be at least 10 characters'),
    body('mainImageUrl').optional().isURL().withMessage('Main image must be a valid URL'),
    body('location').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Location must be between 5 and 200 characters'),
    body('city').optional().trim().isLength({ min: 2, max: 100 }).withMessage('City must be between 2 and 100 characters'),
    body('region').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Region must be between 2 and 100 characters'),
    body('price').optional().isFloat({ min: 0.01 }).withMessage('Price must be a positive number'),
    body('propertyType').optional().isIn(['hostel', 'hotel', 'homestay', 'apartment', 'guesthouse']).withMessage('Invalid property type'),
    body('roomType').optional().isLength({ max: 100 }).withMessage('Room type must be 100 characters or less'),
    body('imageRoomTypes').optional().isArray().withMessage('Image room types must be an array'),
    body('categoryId').optional().isUUID().withMessage('Category ID must be a valid UUID'),
    body('currency').optional().isLength({ max: 10 }).withMessage('Currency must be 10 characters or less'),
    body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),
    body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a non-negative integer'),
    body('status').optional().isIn(['active', 'inactive', 'maintenance', 'booked']).withMessage('Invalid status'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  validateRequest,
  AdminController.updateProperty
);
router.delete('/properties/:id', logRequest, authenticateAdmin, requireAdminRole(), AdminController.deleteProperty);
router.patch('/properties/:id/status', logRequest, authenticateAdmin, requireAdminRole(), AdminController.updatePropertyStatus);
router.patch('/properties/:id/rating', logRequest, authenticateAdmin, requireAdminRole(), AdminController.updatePropertyRating);
router.patch('/properties/bulk-status', 
  logRequest,
  authenticateAdmin,
  requireAdminRole(),
  [
    body('propertyIds').isArray({ min: 1 }).withMessage('Property IDs must be a non-empty array'),
    body('propertyIds.*').isUUID().withMessage('Each property ID must be a valid UUID'),
    body('status').optional().isIn(['active', 'inactive', 'maintenance', 'booked']).withMessage('Invalid status'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean')
  ],
  validateRequest,
  AdminController.bulkUpdatePropertyStatuses
);
router.get('/categories', logRequest, authenticateAdmin, requireAdminRole(), AdminController.getAllCategories);
router.get('/categories/:id', logRequest, authenticateAdmin, requireAdminRole(), AdminController.getCategoryDetails);
router.post('/categories', 
  logRequest,
  authenticateAdmin,
  requireAdminRole(),
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters'),
    body('description').trim().isLength({ min: 5 }).withMessage('Category description must be at least 5 characters'),
    body('imageUrl').isURL().withMessage('Category image must be a valid URL'),
    body('type').optional().isIn(['hostel', 'hotel', 'homestay', 'apartment', 'guesthouse']).withMessage('Invalid category type'),
    body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a non-negative integer')
  ],
  validateRequest,
  AdminController.createCategory
);
router.put('/categories/:id', 
  logRequest,
  authenticateAdmin,
  requireAdminRole(),
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters'),
    body('description').optional().trim().isLength({ min: 5 }).withMessage('Category description must be at least 5 characters'),
    body('imageUrl').optional().isURL().withMessage('Category image must be a valid URL'),
    body('type').optional().isIn(['hostel', 'hotel', 'homestay', 'apartment', 'guesthouse']).withMessage('Invalid category type'),
    body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a non-negative integer'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  validateRequest,
  AdminController.updateCategory
);
router.delete('/categories/:id', logRequest, authenticateAdmin, requireAdminRole(), AdminController.deleteCategory);
router.patch('/categories/:id/status', logRequest, authenticateAdmin, requireAdminRole(), AdminController.updateCategoryStatus);
router.get('/categories-stats', logRequest, authenticateAdmin, requireAdminRole(), AdminController.getCategoryStats);
console.log('🔧 [ROUTER SETUP] Admin routes setup complete - Login route is PUBLIC, all others require authentication');
export default router; 