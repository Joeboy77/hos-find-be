import express, { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { BookingController } from '../controllers/bookingController';
import { authenticateUser, authenticateAdmin } from '../middleware/auth';

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
  // checkOutDate, guests, and specialRequests removed (no longer required)
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

// Admin routes
router.get('/admin/all', logRequest, authenticateAdmin, BookingController.getAllBookings);
router.get('/admin/stats', logRequest, authenticateAdmin, BookingController.getBookingStats);
router.patch('/admin/:bookingId/status', logRequest, authenticateAdmin, updateBookingStatusValidation, BookingController.updateBookingStatus);

export default router;