import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import paymentService from '../services/paymentService';
import { AppDataSource } from '../config/database';
import { Booking, BookingStatus } from '../models/Booking';
import { User } from '../models/User';

export class PaymentController {
  /**
   * Initialize payment for a booking
   */
  static async initializePayment(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { bookingId, email } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Get booking details
      const bookingRepository = AppDataSource.getRepository(Booking);
      const userRepository = AppDataSource.getRepository(User);

      const booking = await bookingRepository.findOne({
        where: { id: bookingId, userId },
        relations: ['user', 'property', 'roomType'],
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }

      // Get user details
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Convert amount to kobo (Paystack expects amount in smallest currency unit)
      const amountInKobo = Math.round(booking.totalAmount * 100);

      // Generate unique reference
      const reference = `hosfind_${bookingId}_${Date.now()}`;

      // Initialize payment with Paystack
      const paymentResult = await paymentService.initializePayment({
        email: email || user.email,
        amount: amountInKobo,
        currency: 'GHS',
        reference,
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
        metadata: {
          bookingId: booking.id,
          userId: user.id,
          propertyName: booking.property?.name,
          roomTypeName: booking.roomType?.name,
        },
      });

      if (!paymentResult.success) {
        return res.status(400).json({
          success: false,
          message: paymentResult.message,
          error: paymentResult.error,
        });
      }

      // Update booking with payment reference
      booking.paymentReference = reference;
      await bookingRepository.save(booking);

      res.json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          authorizationUrl: paymentResult.data.authorization_url,
          accessCode: paymentResult.data.access_code,
          reference: paymentResult.data.reference,
          booking: {
            id: booking.id,
            totalAmount: booking.totalAmount,
            currency: booking.currency,
            propertyName: booking.property?.name,
            roomTypeName: booking.roomType?.name,
          },
        },
      });
    } catch (error) {
      console.error('Error initializing payment:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Verify payment after successful transaction
   */
  static async verifyPayment(req: Request, res: Response) {
    try {
      const { reference } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Find booking by payment reference
      const bookingRepository = AppDataSource.getRepository(Booking);
      const booking = await bookingRepository.findOne({
        where: { paymentReference: reference, userId },
        relations: ['user', 'property', 'roomType'],
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }

      // Verify payment with Paystack
      const verificationResult = await paymentService.verifyPayment(reference);

      if (!verificationResult.success) {
        return res.status(400).json({
          success: false,
          message: verificationResult.message,
          error: verificationResult.error,
        });
      }

      const paymentData = verificationResult.data;

      // Check if payment was successful
      if (paymentData.status === 'success') {
        // Extract phone number from Paystack response
        // Paystack returns phone in customer.phone or authorization.phone
        const phoneNumber = paymentData.customer?.phone || paymentData.authorization?.phone || null;
        
        // Update user's phone number if it's not already set and we got it from Paystack
        if (phoneNumber && booking.user && !booking.user.phoneNumber) {
          const userRepository = AppDataSource.getRepository(User);
          await userRepository.update(booking.user.id, {
            phoneNumber: phoneNumber
          });
        }

        // Update booking status
        booking.status = BookingStatus.CONFIRMED;
        booking.isPaid = true;
        await bookingRepository.save(booking);

        res.json({
          success: true,
          message: 'Payment verified successfully',
          data: {
            booking: {
              id: booking.id,
              status: booking.status,
              isPaid: booking.isPaid,
              totalAmount: booking.totalAmount,
              currency: booking.currency,
              propertyName: booking.property?.name,
              roomTypeName: booking.roomType?.name,
              checkInDate: booking.checkInDate,
            },
            payment: {
              reference: paymentData.reference,
              status: paymentData.status,
              amount: paymentData.amount,
              currency: paymentData.currency,
              paidAt: paymentData.paid_at,
            },
          },
        });
      } else {
        res.json({
          success: false,
          message: 'Payment not successful',
          data: {
            status: paymentData.status,
            reference: paymentData.reference,
          },
        });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get payment public key for client-side initialization
   */
  static async getPublicKey(req: Request, res: Response) {
    try {
      const publicKey = paymentService.getPublicKey();
      const isTestMode = paymentService.isInTestMode();

      res.json({
        success: true,
        data: {
          publicKey,
          isTestMode,
        },
      });
    } catch (error) {
      console.error('Error getting public key:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle Paystack webhook
   */
  static async handleWebhook(req: Request, res: Response) {
    try {
      const { event, data } = req.body;

      if (event === 'charge.success') {
        const { reference } = data;

        // Find booking by payment reference
        const bookingRepository = AppDataSource.getRepository(Booking);
        const booking = await bookingRepository.findOne({
          where: { paymentReference: reference },
          relations: ['user', 'property', 'roomType'],
        });

        if (booking) {
          // Extract phone number from Paystack webhook data
          const phoneNumber = data.customer?.phone || data.authorization?.phone || null;
          
          // Update user's phone number if it's not already set and we got it from Paystack
          if (phoneNumber && booking.user && !booking.user.phoneNumber) {
            const userRepository = AppDataSource.getRepository(User);
            await userRepository.update(booking.user.id, {
              phoneNumber: phoneNumber
            });
          }

          // Update booking status
          booking.status = BookingStatus.CONFIRMED;
          booking.isPaid = true;
          await bookingRepository.save(booking);

          console.log(`Payment webhook processed for booking ${booking.id}`);
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}