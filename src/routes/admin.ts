import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticateAdmin, requireAdminRole } from '../middleware/adminAuth';
import { body } from 'express-validator';

const router = Router();

// All admin routes require authentication
router.use(authenticateAdmin);

// Dashboard statistics (all admin roles)
router.get('/dashboard', AdminController.getDashboardStats);

// User management (admin access required)
router.get('/users', requireAdminRole(), AdminController.getAllUsers);
router.get('/users/:userId', requireAdminRole(), AdminController.getUserDetails);
router.patch('/users/:userId/status', requireAdminRole(), AdminController.updateUserStatus);

// Admin management (admin access required)
router.post('/admins', 
  requireAdminRole(),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').trim().isLength({ min: 2 })
  ],
  AdminController.createAdmin
);

export default router; 