import express, { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { BookingController } from '../controllers/bookingController';
import { authenticateUser } from '../middleware/auth';

const logRequest = (req: Request, res: Response, next: NextFunction): void => {
  console.log(`📝 [BOOKING] ${req.method} ${req.originalUrl}`);
  next();
};

const router = express.Router();

// Validation middleware for creating booking
const createBookingValidation = [
  body('userId').isUUID().withMessage('Valid user ID is required'),
  body('propertyId').isUUID().withMessage('Valid property ID is required'),
  body('roomTypeId').isUUID().withMessage('Valid room type ID is required'),
  body('checkInDate').isISO8601().withMessage('Valid check-in date is required'),
  // checkOutDate removed (no longer required)
  body('guests').optional().isInt({ min: 1, max: 10 }).withMessage('Guests must be between 1 and 10'),
  body('specialRequests').optional().isString().withMessage('Special requests must be a string'),
];

// Validation middleware for updating booking status
const updateBookingStatusValidation = [
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Invalid booking status'),
  body('paymentReference').optional().isString().withMessage('Payment reference must be a string'),
];

// Routes
router.post('/', logRequest, authenticateUser, createBookingValidation, BookingController.createBooking);
router.get('/user/:userId', logRequest, authenticateUser, BookingController.getUserBookings);
router.get('/:id', logRequest, authenticateUser, BookingController.getBookingById);
router.patch('/:id/status', logRequest, authenticateUser, updateBookingStatusValidation, BookingController.updateBookingStatus);
router.patch('/:id/cancel', logRequest, authenticateUser, BookingController.cancelBooking);

export default router;