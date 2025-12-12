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

      // Check room availability (prevent overbooking)
      if (roomType.availableRooms <= 0) {
        return res.status(400).json({
          success: false,
          message: 'No rooms available for this room type',
        });
      }

      // Capacity check removed - no longer tracking guests

      // Calculate total amount with 8% service charge
      // Ensure roomPrice is a number (decimal from DB might be string)
      const roomPrice = typeof roomType.price === 'string' 
        ? parseFloat(roomType.price) 
        : Number(roomType.price);
      
      if (isNaN(roomPrice) || roomPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid room price',
        });
      }

      const serviceCharge = roomPrice * 0.08; // 8% service charge
      // Round to 2 decimal places to avoid floating point precision issues
      const totalAmount = Math.round((roomPrice + serviceCharge) * 100) / 100;

      // Ensure totalAmount is a valid number
      if (isNaN(totalAmount) || totalAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid total amount calculated',
        });
      }

      // Create booking
      const booking = new Booking();
      booking.userId = userId;
      booking.propertyId = propertyId;
      booking.roomTypeId = roomTypeId;
      booking.checkInDate = checkInDate;
      // checkout, guests, and specialRequests removed
      // Explicitly ensure totalAmount is a number (TypeORM decimal expects number)
      booking.totalAmount = Number(totalAmount);
      booking.currency = roomType.currency || 'GHS';
      booking.status = BookingStatus.PENDING;

      const savedBooking = await bookingRepository.save(booking);

      // Decrement available rooms count after successful booking
      roomType.availableRooms = roomType.availableRooms - 1;
      await roomTypeRepository.save(roomType);

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

      // If relations are not loaded, try a different approach
      if (bookings.length > 0 && !bookings[0].property) {
        console.log('[BOOKING CONTROLLER] Relations not loaded, trying query builder approach');
        const bookingsWithRelations = await bookingRepository
          .createQueryBuilder('booking')
          .leftJoinAndSelect('booking.property', 'property')
          .leftJoinAndSelect('booking.roomType', 'roomType')
          .where('booking.userId = :userId', { userId })
          .orderBy('booking.createdAt', 'DESC')
          .getMany();
        
        console.log('[BOOKING CONTROLLER] Query builder result:', bookingsWithRelations[0] ? {
          id: bookingsWithRelations[0].id,
          hasProperty: !!bookingsWithRelations[0].property,
          hasRoomType: !!bookingsWithRelations[0].roomType,
          propertyName: bookingsWithRelations[0].property?.name,
          roomTypeName: bookingsWithRelations[0].roomType?.name
        } : 'No bookings');
        
        return res.json({
          success: true,
          data: bookingsWithRelations,
        });
      }

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

      // Increment available rooms count when booking is cancelled
      const roomTypeRepository = AppDataSource.getRepository(RoomType);
      const roomType = await roomTypeRepository.findOne({ 
        where: { id: booking.roomTypeId } 
      });
      if (roomType) {
        roomType.availableRooms = roomType.availableRooms + 1;
        await roomTypeRepository.save(roomType);
      }

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

  // Get all bookings for admin
  static async getAllBookings(req: Request, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        propertyId, 
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const bookingRepository = AppDataSource.getRepository(Booking);
      const queryBuilder = bookingRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.property', 'property')
        .leftJoinAndSelect('booking.roomType', 'roomType')
        .leftJoinAndSelect('booking.user', 'user');

      // Apply filters
      if (status) {
        queryBuilder.andWhere('booking.status = :status', { status });
      }

      if (propertyId) {
        queryBuilder.andWhere('booking.propertyId = :propertyId', { propertyId });
      }

      if (search) {
        queryBuilder.andWhere(
          '(property.name ILIKE :search OR user.fullName ILIKE :search OR user.email ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      // Apply sorting
      const validSortFields = ['createdAt', 'checkInDate', 'totalAmount', 'status'];
      const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
      const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';
      
      queryBuilder.orderBy(`booking.${sortField}`, order);

      // Apply pagination
      const offset = (Number(page) - 1) * Number(limit);
      queryBuilder.skip(offset).take(Number(limit));

      const [bookings, total] = await queryBuilder.getManyAndCount();

      return res.json({
        success: true,
        data: {
          bookings,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error('[BOOKING CONTROLLER] Error fetching all bookings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch bookings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get booking statistics for admin dashboard
  static async getBookingStats(req: Request, res: Response) {
    try {
      const bookingRepository = AppDataSource.getRepository(Booking);
      
      const [
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        totalRevenue
      ] = await Promise.all([
        bookingRepository.count(),
        bookingRepository.count({ where: { status: BookingStatus.CONFIRMED } }),
        bookingRepository.count({ where: { status: BookingStatus.PENDING } }),
        bookingRepository.count({ where: { status: BookingStatus.CANCELLED } }),
        bookingRepository
          .createQueryBuilder('booking')
          .select('SUM(CAST(booking.totalAmount AS DECIMAL))', 'total')
          .where('booking.status = :status', { status: BookingStatus.CONFIRMED })
          .getRawOne()
      ]);

      return res.json({
        success: true,
        data: {
          totalBookings,
          confirmedBookings,
          pendingBookings,
          cancelledBookings,
          totalRevenue: totalRevenue?.total || '0',
        },
      });
    } catch (error) {
      console.error('[BOOKING CONTROLLER] Error fetching booking stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch booking statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

}