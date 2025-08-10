import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { authController } from '../controllers/authController';
const router = Router();
const signupValidation = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  body('phoneNumber')
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
  body('location')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  body('gender')
    .isIn(['male', 'female'])
    .withMessage('Gender must be either male or female')
];
const loginValidation = [
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];
router.post('/signup', signupValidation, validateRequest, authController.signup);
router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
export default router; 