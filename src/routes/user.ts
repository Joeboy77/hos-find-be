import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middleware/authenticateToken';
import { body } from 'express-validator';
const router = Router();
router.get('/categories', UserController.getCategories);
router.get('/properties', UserController.getProperties);
router.get('/properties/featured', UserController.getFeaturedProperties);
router.get('/properties/search', UserController.searchProperties);
router.get('/properties/category/:categoryId', UserController.getPropertiesByCategory);
router.get('/properties/type/:type', UserController.getPropertiesByType);
router.get('/properties/region/:region', UserController.getPropertiesByRegion);
router.get('/properties/:id', UserController.getPropertyById);
router.use(authenticateToken);
router.get('/profile', UserController.getProfile);
router.put('/profile', [
  body('fullName').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phoneNumber').optional().isMobilePhone('any'),
  body('location').optional().trim(),
  body('password').optional().isLength({ min: 6 })
], UserController.updateProfile);
router.patch('/profile', [
  body('fullName').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phoneNumber').optional().isMobilePhone('any'),
  body('location').optional().trim(),
  body('password').optional().isLength({ min: 6 })
], UserController.updateProfile);
router.delete('/profile', UserController.deleteProfile);
export default router; 