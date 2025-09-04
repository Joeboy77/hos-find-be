import express, { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { PaymentController } from '../controllers/paymentController';
import { authenticateUser } from '../middleware/auth';

const logRequest = (req: Request, res: Response, next: NextFunction): void => {
  console.log(`💳 [PAYMENT] ${req.method} ${req.originalUrl}`);
  next();
};

const router = express.Router();

// Validation middleware for initializing payment
const initializePaymentValidation = [
  body('bookingId').isUUID().withMessage('Valid booking ID is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
];

// Routes
router.post('/initialize', logRequest, authenticateUser, initializePaymentValidation, PaymentController.initializePayment);
router.get('/verify/:reference', logRequest, authenticateUser, PaymentController.verifyPayment);
router.get('/public-key', logRequest, PaymentController.getPublicKey);
router.post('/webhook', logRequest, PaymentController.handleWebhook);

export default router;