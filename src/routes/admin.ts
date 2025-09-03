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
router.get('/users/stats', logRequest, authenticateAdmin, requireAdminRole(), AdminController.getUserStats);
router.get('/users/:userId', logRequest, authenticateAdmin, requireAdminRole(), AdminController.getUserDetails);
router.patch('/users/:userId/status', logRequest, authenticateAdmin, requireAdminRole(), AdminController.updateUserStatus);
router.delete('/users/:userId', logRequest, authenticateAdmin, requireAdminRole(), AdminController.deleteUser);

// Notification routes
router.get('/notifications', logRequest, authenticateAdmin, requireAdminRole(), AdminController.getAllNotifications);
router.get('/notifications-stats', logRequest, authenticateAdmin, requireAdminRole(), AdminController.getNotificationStats);
router.post('/notifications', 
  logRequest,
  authenticateAdmin,
  requireAdminRole(),
  [
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
    body('type').optional().isIn(['new_property', 'property_update', 'system', 'promotion']).withMessage('Invalid notification type'),
    body('targetUsers').isIn(['all', 'verified']).withMessage('Target users must be either "all" or "verified"')
  ],
  validateRequest,
  AdminController.createNotification
);
router.delete('/notifications/:id', logRequest, authenticateAdmin, requireAdminRole(), AdminController.deleteNotification);
router.patch('/notifications/:id/read', logRequest, authenticateAdmin, requireAdminRole(), AdminController.markNotificationAsRead);

// Settings routes
router.get('/profile', logRequest, authenticateAdmin, requireAdminRole(), AdminController.getAdminProfile);
router.put('/profile', 
  logRequest,
  authenticateAdmin,
  requireAdminRole(),
  [
    body('fullName').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('currentPassword').optional().isLength({ min: 6 }).withMessage('Current password must be at least 6 characters'),
    body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  validateRequest,
  AdminController.updateAdminProfile
);

router.get('/settings', logRequest, authenticateAdmin, requireAdminRole(), AdminController.getAppSettings);
router.put('/settings',
  logRequest,
  authenticateAdmin,
  requireAdminRole(),
  [
    body('maintenanceMode').optional().isBoolean().withMessage('Maintenance mode must be a boolean'),
    body('allowRegistrations').optional().isBoolean().withMessage('Allow registrations must be a boolean'),
    body('requireEmailVerification').optional().isBoolean().withMessage('Require email verification must be a boolean'),
    body('requirePhoneVerification').optional().isBoolean().withMessage('Require phone verification must be a boolean')
  ],
  validateRequest,
  AdminController.updateAppSettings
);

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
    body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
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
    body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
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
// Room Type Management Routes
router.get('/room-types', logRequest, authenticateAdmin, requireAdminRole(), AdminController.getAllRoomTypes);
router.post('/room-types', 
  logRequest,
  authenticateAdmin,
  requireAdminRole(),
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Room type name must be between 2 and 100 characters'),
    body('description').optional().trim().isLength({ min: 10 }).withMessage('Room type description must be at least 10 characters'),
    body('price').isFloat({ min: 0.01 }).withMessage('Price must be a positive number'),
    body('currency').optional().isLength({ max: 10 }).withMessage('Currency must be 10 characters or less'),
    body('genderType').optional().isIn(['male', 'female', 'mixed', 'any']).withMessage('Invalid gender type'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    body('roomTypeCategory').optional().isLength({ max: 50 }).withMessage('Room type category must be 50 characters or less'),
    body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
    body('availableRooms').optional().isInt({ min: 0 }).withMessage('Available rooms must be a non-negative integer'),
    body('totalRooms').optional().isInt({ min: 1 }).withMessage('Total rooms must be at least 1'),
    body('amenities').optional().isArray().withMessage('Amenities must be an array'),
    body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),
    body('propertyId').isUUID().withMessage('Property ID must be a valid UUID'),
    body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a non-negative integer')
  ],
  validateRequest,
  AdminController.createRoomType
);

router.put('/room-types/:id', 
  logRequest,
  authenticateAdmin,
  requireAdminRole(),
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Room type name must be between 2 and 100 characters'),
    body('description').optional().trim().isLength({ min: 10 }).withMessage('Room type description must be at least 10 characters'),
    body('price').optional().isFloat({ min: 0.01 }).withMessage('Price must be a positive number'),
    body('currency').optional().isLength({ max: 10 }).withMessage('Currency must be 10 characters or less'),
    body('genderType').optional().isIn(['male', 'female', 'mixed', 'any']).withMessage('Invalid gender type'),
    body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    body('roomTypeCategory').optional().isLength({ max: 50 }).withMessage('Room type category must be 50 characters or less'),
    body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
    body('availableRooms').optional().isInt({ min: 0 }).withMessage('Available rooms must be a non-negative integer'),
    body('totalRooms').optional().isInt({ min: 1 }).withMessage('Total rooms must be at least 1'),
    body('amenities').optional().isArray().withMessage('Amenities must be an array'),
    body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),
    body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a non-negative integer'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  validateRequest,
  AdminController.updateRoomType
);

router.delete('/room-types/:id', logRequest, authenticateAdmin, requireAdminRole(), AdminController.deleteRoomType);
router.get('/room-types/:id', logRequest, authenticateAdmin, requireAdminRole(), AdminController.getRoomTypeDetails);

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
    body('icon').notEmpty().withMessage('Category icon is required'),
    body('color').notEmpty().withMessage('Category color is required'),
    body('description').optional().trim().isLength({ min: 5 }).withMessage('Category description must be at least 5 characters'),
    body('imageUrl').optional().isURL().withMessage('Category image must be a valid URL'),
    body('type').optional().isIn(['hostel', 'hotel', 'homestay', 'apartment', 'guesthouse', 'villa', 'resort', 'bungalow', 'studio']).withMessage('Invalid category type'),
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

// Test push notification route
router.post('/test-push-notification', logRequest, authenticateAdmin, requireAdminRole(), AdminController.testPushNotification);

// Regional Sections routes
router.get('/regional-sections', logRequest, authenticateAdmin, requireAdminRole(), AdminController.getAllRegionalSections);
router.post('/regional-sections', 
  logRequest,
  authenticateAdmin,
  requireAdminRole(),
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Regional section name must be between 2 and 100 characters'),
    body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a non-negative integer')
  ],
  validateRequest,
  AdminController.createRegionalSection
);
router.put('/regional-sections/:id', 
  logRequest,
  authenticateAdmin,
  requireAdminRole(),
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Regional section name must be between 2 and 100 characters'),
    body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a non-negative integer'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  validateRequest,
  AdminController.updateRegionalSection
);
router.delete('/regional-sections/:id', logRequest, authenticateAdmin, requireAdminRole(), AdminController.deleteRegionalSection);

// Property assignment to regional sections
router.post('/assign-property-to-regional-section',
  logRequest,
  authenticateAdmin,
  requireAdminRole(),
  [
    body('propertyId').isUUID().withMessage('Property ID must be a valid UUID'),
    body('regionalSectionId').isUUID().withMessage('Regional Section ID must be a valid UUID')
  ],
  validateRequest,
  AdminController.assignPropertyToRegionalSection
);

console.log('🔧 [ROUTER SETUP] Admin routes setup complete - Login route is PUBLIC, all others require authentication');
export default router; 