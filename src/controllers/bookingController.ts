import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Booking, BookingStatus } from '../models/Booking';
import { User } from '../models/User';
import { Property } from '../models/Property';
import { RoomType } from '../models/RoomType';
import { body, validationResult } from 'express-validator';

export class BookingController {
  // Create a new booking
  static async createBooking(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { 
        userId, 
        propertyId, 
        roomTypeId, 
        checkInDate 
      } = req.body;

      // Validate dates
      const checkIn = new Date(checkInDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkIn < today) {
        return res.status(400).json({
          success: false,
          message: 'Check-in date cannot be in the past',
        });
      }

      // We no longer collect/require check-out; treat as same-day booking

      // Get repositories
      const bookingRepository = AppDataSource.getRepository(Booking);
      const userRepository = AppDataSource.getRepository(User);
      const propertyRepository = AppDataSource.getRepository(Property);
      const roomTypeRepository = AppDataSource.getRepository(RoomType);

      // Verify user exists
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Verify property exists
      const property = await propertyRepository.findOne({ 
        where: { id: propertyId },
        relations: ['roomTypes']
      });
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
        });
      }

      // Verify room type exists and belongs to property
      const roomType = await roomTypeRepository.findOne({ 
        where: { id: roomTypeId, propertyId: propertyId }
      });
      if (!roomType) {
        return res.status(404).json({
          success: false,
          message: 'Room type not found or does not belong to this property',
        });
      }

      // Check if room type is available
      if (!roomType.isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'This room type is not available for booking',
        });
      }

      // Capacity check removed - no longer tracking guests

      // Calculate total amount (for now, just room price per night)
      const totalAmount = roomType.price; // flat price for same-day move-in

      // Create booking
      const booking = new Booking();
      booking.userId = userId;
      booking.propertyId = propertyId;
      booking.roomTypeId = roomTypeId;
      booking.checkInDate = checkInDate;
      // checkout, guests, and specialRequests removed
      booking.totalAmount = totalAmount;
      booking.currency = roomType.currency || 'GHS';
      booking.status = BookingStatus.PENDING;

      const savedBooking = await bookingRepository.save(booking);

      // Return booking with populated relations
      const bookingWithRelations = await bookingRepository.findOne({
        where: { id: savedBooking.id },
        relations: ['user', 'property', 'roomType'],
      });

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: bookingWithRelations,
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get user's bookings
  static async getUserBookings(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      console.log(`[BOOKING CONTROLLER] Fetching bookings for user: ${userId}`);

      const bookingRepository = AppDataSource.getRepository(Booking);
      const bookings = await bookingRepository.find({
        where: { userId },
        relations: ['property', 'roomType'],
        order: { createdAt: 'DESC' },
      });

      console.log(`[BOOKING CONTROLLER] Found ${bookings.length} bookings`);
      console.log(`[BOOKING CONTROLLER] Sample booking:`, bookings[0] ? {
        id: bookings[0].id,
        hasProperty: !!bookings[0].property,
        hasRoomType: !!bookings[0].roomType,
        propertyName: bookings[0].property?.name,
        roomTypeName: bookings[0].roomType?.name
      } : 'No bookings');

      res.json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get booking by ID
  static async getBookingById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const bookingRepository = AppDataSource.getRepository(Booking);
      const booking = await bookingRepository.findOne({
        where: { id },
        relations: ['user', 'property', 'roomType'],
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }

      res.json({
        success: true,
        data: booking,
      });
    } catch (error) {
      console.error('Error fetching booking:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Update booking status
  static async updateBookingStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, paymentReference } = req.body;

      const bookingRepository = AppDataSource.getRepository(Booking);
      const booking = await bookingRepository.findOne({ where: { id } });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }

      // Validate status
      if (!Object.values(BookingStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid booking status',
        });
      }

      booking.status = status;
      if (paymentReference) {
        booking.paymentReference = paymentReference;
        booking.isPaid = status === BookingStatus.CONFIRMED;
      }

      const updatedBooking = await bookingRepository.save(booking);

      res.json({
        success: true,
        message: 'Booking status updated successfully',
        data: updatedBooking,
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Cancel booking
  static async cancelBooking(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const bookingRepository = AppDataSource.getRepository(Booking);
      const booking = await bookingRepository.findOne({ where: { id } });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }

      if (booking.status === BookingStatus.CANCELLED) {
        return res.status(400).json({
          success: false,
          message: 'Booking is already cancelled',
        });
      }

      if (booking.status === BookingStatus.COMPLETED) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel a completed booking',
        });
      }

      booking.status = BookingStatus.CANCELLED;
      const updatedBooking = await bookingRepository.save(booking);

      res.json({
        success: true,
        message: 'Booking cancelled successfully',
        data: updatedBooking,
      });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}